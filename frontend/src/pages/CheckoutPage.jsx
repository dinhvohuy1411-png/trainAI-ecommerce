import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import cartApi from '../api/cartApi'
import couponApi from '../api/couponApi'
import paymentApi from '../api/paymentApi'
import axiosClient from '../api/axiosClient'

import logoVnPay from '../assets/logoVnPay.jpg'

const CheckoutPage = () => {
  const { state } = useLocation()
  const navigate = useNavigate()

  const selectedItems = state?.selectedItems || []

  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)

  const [cartItems, setCartItems] = useState([])

  // --- STATE THANH TOÁN (Mặc định là 1 - COD) ---
  const [paymentMethod, setPaymentMethod] = useState(1)
  const [loading, setLoading] = useState(false)

  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShippingId, setSelectedShippingId] = useState(null)
  const [shippingFee, setShippingFee] = useState(0)

  const [coupons, setCoupons] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)

  const [showCouponModal, setShowCouponModal] = useState(false)
  const [manualCode, setManualCode] = useState('')
  const [couponApplying, setCouponApplying] = useState(false)

  const shopIdList = Array.from(
    new Set(cartItems.map((item) => item.shop_id).filter(Boolean))
  )

  const shopSubtotalMap = cartItems.reduce((acc, item) => {
    const shopId = item.shop_id
    if (!shopId) return acc
    acc[shopId] = (acc[shopId] ?? 0) + Number(item.price) * item.quantity
    return acc
  }, {})

  const singleShopId = shopIdList.length === 1 ? shopIdList[0] : null

  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate('/cart')
    }
    const fetchData = async () => {
      try {
        const cartRes = await cartApi.getCart()
        const addrRes = await cartApi.getAddresses().catch(() => ({ data: [] }))

        const shipRes = await axiosClient
          .get('/shipping-methods')
          .catch(() => ({ data: [] }))

        const cartData = cartRes.data || {}
        const allItems = Object.values(cartData).flat()

        const filtered = allItems.filter((item) =>
          selectedItems.some((id) => String(id) === String(item.id))
        )

        setCartItems(filtered)
        setAppliedCoupon(null)
        setDiscountAmount(0)
        setShowCouponModal(false)

        const addrList = addrRes.data || []
        setAddresses(addrList)
        if (addrList.length > 0) {
          const defaultAddr = addrList.find((a) => a.is_default) || addrList[0]
          setSelectedAddress(defaultAddr)
        }

        const shipList = shipRes.data || []
        setShippingMethods(shipList)
        if (shipList.length > 0) {
          setSelectedShippingId(shipList[0].id)
          setShippingFee(Number(shipList[0].base_fee))
        }

        const filteredShopIdList = Array.from(
          new Set(filtered.map((item) => item.shop_id).filter(Boolean))
        )
        const shopIdForCoupons =
          filteredShopIdList.length === 1 ? filteredShopIdList[0] : null

        const couponRes = await couponApi
          .getCoupons(shopIdForCoupons)
          .catch(() => ({ data: [] }))
        setCoupons(couponRes.data || [])
      } catch (error) {
        console.error('Checkout load error:', error)
      }
    }

    if (selectedItems.length > 0) {
      fetchData()
    }
  }, [selectedItems, navigate])

  const totalProductPrice = cartItems.reduce(
    (sum, item) => sum + Number(item.price) * item.quantity,
    0
  )

  const finalTotal = Math.max(
    0,
    totalProductPrice + shippingFee - discountAmount
  )

  const handleShippingChange = (method) => {
    setSelectedShippingId(method.id)
    setShippingFee(Number(method.base_fee))
  }

  const handleApplyCoupon = async (code) => {
    if (couponApplying) return
    try {
      setCouponApplying(true)

      const payload = {
        coupon_code: code,
        order_total: singleShopId
          ? shopSubtotalMap[singleShopId]
          : totalProductPrice,
      }

      if (singleShopId) {
        payload.shop_id = singleShopId
      }

      const res = await couponApi.applyCoupon(payload)

      setAppliedCoupon(res.data)
      setDiscountAmount(Number(res.data.discount_amount) || 0)
      setManualCode('')
      setShowCouponModal(false)

      alert(
        `Áp dụng thành công. Giảm ${res.data.discount_amount.toLocaleString()}đ`
      )
    } catch (err) {
      alert(
        err.response?.data?.message ||
          'Mã giảm giá không hợp lệ hoặc chưa đủ điều kiện'
      )
    } finally {
      setCouponApplying(false)
    }
  }

  const handleManualApply = () => {
    if (!manualCode.trim()) {
      alert('Nhập mã giảm giá')
      return
    }
    handleApplyCoupon(manualCode.trim().toUpperCase())
  }

  // ========================================================
  // XỬ LÝ ĐẶT HÀNG VÀ CHỌN CỔNG THANH TOÁN TƯƠNG ỨNG
  // ========================================================
  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      alert('Vui lòng chọn địa chỉ')
      return
    }
    if (!selectedShippingId) {
      alert('Vui lòng chọn phương thức vận chuyển')
      return
    }

    setLoading(true)

    try {
      // 1. Gửi request tạo đơn hàng lưu vào DB
      const orderRes = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: selectedShippingId,
        coupon_code: appliedCoupon?.code,
      })

      const { order_ids, total_amount, message } = orderRes.data

      // 2. Rẽ nhánh thanh toán dựa theo lựa chọn của người dùng
      if (paymentMethod === 2) {
        // --- CHỌN MOMO ---
        // Lưu ý: Đảm bảo trong paymentApi.js bạn có hàm createMoMoUrl gọi đến route /payment/momo
        const payRes = await paymentApi.createMoMoUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        const url = payRes.data.paymentUrl || payRes.data.url
        if (url) {
          window.location.href = url
        } else {
          alert('Không lấy được link thanh toán MoMo')
        }
      } else if (paymentMethod === 3) {
        // --- CHỌN VNPAY ---

        const payRes = await paymentApi.createVNPayUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        const url = payRes.data.paymentUrl || payRes.data.url
        if (url) {
          window.location.href = url
        } else {
          alert('Không lấy được link thanh toán VNPay')
        }
      } else {
        // --- CHỌN COD ---
        alert(message || 'Đặt hàng thành công')
        navigate('/orders')
        localStorage.removeItem('CART')
        window.dispatchEvent(new Event('storage'))
      }
    } catch (error) {
      alert(error.response?.data?.message || 'Đặt hàng thất bại')
    } finally {
      setLoading(false)
    }
  }

  const handleChangeAddress = () => {
    if (addresses.length === 0) {
      alert('Chưa có địa chỉ')
      return
    }

    const currentIndex = addresses.findIndex((a) => a.id === selectedAddress.id)
    const nextIndex = (currentIndex + 1) % addresses.length

    setSelectedAddress(addresses[nextIndex])
  }

  return (
    <div
      style={{ background: '#f5f5f5', minHeight: '100vh', paddingBottom: 40 }}
    >
      <div style={{ background: '#fff', padding: 20, marginBottom: 20 }}>
        <h2 style={{ color: '#ee4d2d' }}>Thanh toán</h2>
      </div>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        {/* ADDRESS */}

        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3>Địa chỉ nhận hàng</h3>

          {selectedAddress ? (
            <div>
              <b>
                {selectedAddress.recipient_name} (+84)
                {selectedAddress.recipient_phone.replace(/^0/, '')}
              </b>

              <div>
                {selectedAddress.address_detail}, {selectedAddress.ward},{' '}
                {selectedAddress.district}, {selectedAddress.city}
              </div>
            </div>
          ) : (
            <p>Chưa có địa chỉ</p>
          )}

          <button onClick={handleChangeAddress}>Thay đổi</button>
        </div>

        {/* PRODUCTS */}

        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3 style={{ fontSize: '16px', marginBottom: '15px', color: '#333' }}>
            Sản phẩm
          </h3>

          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '15px 0',
                borderBottom: '1px solid #f5f5f5',
              }}
            >
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '15px' }}
              >
                <img
                  src={item.image || 'https://placehold.co/80x80?text=No+Image'}
                  alt={item.product_name}
                  style={{
                    width: '60px',
                    height: '60px',
                    objectFit: 'cover',
                    borderRadius: '4px',
                    border: '1px solid #eee',
                  }}
                />
                <div>
                  <div
                    style={{
                      fontSize: '15px',
                      color: '#333',
                      marginBottom: '5px',
                    }}
                  >
                    {item.product_name}
                  </div>
                  <div style={{ fontSize: '13px', color: '#888' }}>
                    Phân loại: {item.sku_code || 'Mặc định'} <br />
                    Số lượng: <strong>x{item.quantity}</strong>
                  </div>
                </div>
              </div>

              <div
                style={{
                  color: '#ee4d2d',
                  fontWeight: '500',
                  fontSize: '15px',
                }}
              >
                {(item.price * item.quantity).toLocaleString()} đ
              </div>
            </div>
          ))}
        </div>

        {/* SHIPPING */}
        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3 style={{ marginBottom: '15px' }}>Phương thức vận chuyển</h3>

          <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
            {shippingMethods.map((method) => (
              <div
                key={method.id}
                onClick={() => handleShippingChange(method)}
                style={{
                  padding: '12px 20px',
                  border:
                    selectedShippingId === method.id
                      ? '1px solid #ee4d2d'
                      : '1px solid #e1e1e1',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  position: 'relative',
                  backgroundColor:
                    selectedShippingId === method.id ? '#fffafa' : 'white',
                  minWidth: '200px',
                }}
              >
                <div
                  style={{
                    color:
                      selectedShippingId === method.id ? '#ee4d2d' : '#333',
                    fontWeight: 'bold',
                    marginBottom: '5px',
                  }}
                >
                  {method.name}
                </div>
                <div style={{ color: '#888', fontSize: '14px' }}>
                  {Number(method.base_fee).toLocaleString()} đ
                </div>

                {selectedShippingId === method.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      bottom: 0,
                      width: 0,
                      height: 0,
                      borderBottom: '20px solid #ee4d2d',
                      borderLeft: '20px solid transparent',
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        right: '2px',
                        bottom: '-18px',
                        color: 'white',
                        fontSize: '10px',
                      }}
                    >
                      ✓
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* PAYMENT */}
        <div style={{ background: '#fff', padding: 20, marginBottom: 15 }}>
          <h3>Phương thức thanh toán</h3>

          <div
            style={{
              display: 'flex',
              gap: '15px',
              marginTop: '15px',
              flexWrap: 'wrap',
            }}
          >
            {/* 1. Nút COD */}
            <button
              onClick={() => setPaymentMethod(1)}
              style={{
                background: paymentMethod === 1 ? '#ee4d2d' : '#f5f5f5',
                color: paymentMethod === 1 ? 'white' : '#333',
                padding: '10px 20px',
                border:
                  paymentMethod === 1 ? '1px solid #ee4d2d' : '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                fontWeight: paymentMethod === 1 ? 'bold' : 'normal',
              }}
            >
              Thanh toán khi nhận hàng (COD)
            </button>

            {/* 2. Nút MoMo */}
            <button
              onClick={() => setPaymentMethod(2)}
              style={{
                background: paymentMethod === 2 ? '#ee4d2d' : '#f5f5f5',
                color: paymentMethod === 2 ? 'white' : '#333',
                padding: '10px 20px',
                border:
                  paymentMethod === 2 ? '1px solid #ee4d2d' : '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: paymentMethod === 2 ? 'bold' : 'normal',
              }}
            >
              <img
                src="https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png"
                height={20}
                alt="MoMo"
                style={{ borderRadius: '4px' }}
              />
              Ví MoMo
            </button>

            {/* 3. Nút VNPay */}
            <button
              onClick={() => setPaymentMethod(3)}
              style={{
                background: paymentMethod === 3 ? '#ee4d2d' : '#f5f5f5',
                color: paymentMethod === 3 ? 'white' : '#333',
                padding: '10px 20px',
                border:
                  paymentMethod === 3 ? '1px solid #ee4d2d' : '1px solid #ddd',
                borderRadius: 4,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                fontWeight: paymentMethod === 3 ? 'bold' : 'normal',
              }}
            >
              <img src={logoVnPay} height={20} alt="VNPay" />
              VNPay
            </button>
          </div>
        </div>

        {/* VOUCHER */}

        <div style={{ background: '#fff', padding: 20 }}>
          <h3>Voucher</h3>
          {!singleShopId && (
            <p style={{ color: 'red', marginTop: 5 }}>
              Chỉ voucher toàn sàn có thể áp dụng khi mua nhiều shop
            </p>
          )}
          {appliedCoupon && <p>Đã áp dụng: {appliedCoupon.code}</p>}

          <div style={{ display: 'flex', gap: 10 }}>
            <input
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              placeholder="Nhập mã giảm giá"
            />

            <button onClick={handleManualApply}>Áp dụng</button>

            <button onClick={() => setShowCouponModal(true)}>
              Chọn Voucher
            </button>
          </div>
        </div>

        {/* TOTAL */}

        <div style={{ background: '#fff', padding: 20, marginTop: 15 }}>
          <div>Tổng tiền hàng: {totalProductPrice.toLocaleString()} đ</div>

          {/* Phí ship hiển thị linh động */}
          <div>Phí ship: {shippingFee.toLocaleString()} đ</div>

          {discountAmount > 0 && (
            <div>- {discountAmount.toLocaleString()} đ</div>
          )}

          <h2 style={{ color: '#ee4d2d' }}>
            Tổng thanh toán: {finalTotal.toLocaleString()} đ
          </h2>

          <button onClick={handlePlaceOrder} disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đặt hàng'}
          </button>
        </div>
      </div>

      {/* COUPON MODAL */}
      {showCouponModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '20px',
              width: '450px',
              maxHeight: '80vh',
              overflowY: 'auto',
              borderRadius: '8px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
            }}
          >
            <h3
              style={{
                marginBottom: '15px',
                borderBottom: '1px solid #eee',
                paddingBottom: '10px',
                color: '#333',
              }}
            >
              Chọn Shopee Voucher
            </h3>

            {coupons.length === 0 ? (
              <p
                style={{ textAlign: 'center', color: '#888', margin: '30px 0' }}
              >
                Không có mã giảm giá nào.
              </p>
            ) : (
              coupons.map((coupon) => {
                const now = new Date()
                const startDate = new Date(coupon.start_date)
                const endDate = new Date(coupon.end_date)

                const isOutOfStock = coupon.usage_limit <= 0
                const isExpired = endDate < now
                const isNotStarted = startDate > now

                const validSubtotal = singleShopId
                  ? shopSubtotalMap[singleShopId]
                  : totalProductPrice
                const minOrder = Number(coupon.min_order_value || 0)
                const isNotEligible = validSubtotal < minOrder

                const isDisabled =
                  isOutOfStock || isExpired || isNotStarted || isNotEligible

                let disableReason = ''
                if (isOutOfStock) disableReason = 'Hết lượt sử dụng'
                else if (isExpired) disableReason = 'Mã đã hết hạn'
                else if (isNotStarted)
                  disableReason = `Có hiệu lực từ ${startDate.toLocaleDateString('vi-VN')}`
                else if (isNotEligible)
                  disableReason = `Mua thêm ${(minOrder - validSubtotal).toLocaleString()}đ để dùng`

                return (
                  <div
                    key={coupon.id}
                    style={{
                      display: 'flex',
                      border: '1px solid #e8e8e8',
                      borderRadius: '4px',
                      marginBottom: '12px',
                      opacity: isDisabled ? 0.6 : 1,
                      background: isDisabled ? '#f9f9f9' : '#fff',
                      overflow: 'hidden',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                    }}
                  >
                    <div
                      style={{
                        background: isDisabled ? '#ccc' : '#26aa99',
                        width: '110px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        alignItems: 'center',
                        color: 'white',
                        padding: '10px',
                        borderRight: '1px dashed #e8e8e8',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '13px',
                          textAlign: 'center',
                          fontWeight: 'bold',
                        }}
                      >
                        Shopii Voucher
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '12px',
                        flex: 1,
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                      }}
                    >
                      <div
                        style={{
                          fontSize: '15px',
                          fontWeight: 'bold',
                          color: '#333',
                        }}
                      >
                        Giảm{' '}
                        {coupon.discount_type === 'percent'
                          ? coupon.discount_value + '%'
                          : Number(coupon.discount_value).toLocaleString() +
                            'đ'}
                      </div>

                      {minOrder > 0 && (
                        <div
                          style={{
                            fontSize: '12px',
                            color: '#555',
                            marginTop: '4px',
                          }}
                        >
                          Đơn tối thiểu {minOrder.toLocaleString()}đ
                        </div>
                      )}

                      <div style={{ fontSize: '12px', marginTop: '6px' }}>
                        {disableReason ? (
                          <span style={{ color: '#ee4d2d' }}>
                            {disableReason}
                          </span>
                        ) : (
                          <span style={{ color: '#888' }}>
                            HSD: {endDate.toLocaleDateString('vi-VN')}
                          </span>
                        )}
                      </div>

                      {!isDisabled &&
                        coupon.usage_limit > 0 &&
                        coupon.usage_limit <= 5 && (
                          <div
                            style={{
                              fontSize: '11px',
                              color: '#ee4d2d',
                              marginTop: '4px',
                              background: '#ffebee',
                              padding: '2px 6px',
                              borderRadius: '10px',
                              display: 'inline-block',
                              width: 'fit-content',
                            }}
                          >
                            Sắp hết: Còn {coupon.usage_limit} lượt
                          </div>
                        )}
                    </div>

                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 15px',
                      }}
                    >
                      <button
                        onClick={() => handleApplyCoupon(coupon.code)}
                        disabled={isDisabled || couponApplying}
                        style={{
                          background: isDisabled ? '#e0e0e0' : '#ee4d2d',
                          color: isDisabled ? '#999' : '#fff',
                          border: 'none',
                          padding: '6px 12px',
                          borderRadius: '4px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          fontSize: '13px',
                          fontWeight: 'bold',
                        }}
                      >
                        Dùng
                      </button>
                    </div>
                  </div>
                )
              })
            )}

            <div style={{ textAlign: 'right', marginTop: '15px' }}>
              <button
                onClick={() => setShowCouponModal(false)}
                style={{
                  padding: '8px 20px',
                  background: '#fff',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  color: '#555',
                }}
              >
                Trở lại
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
