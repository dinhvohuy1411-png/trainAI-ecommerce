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

  // --- HỆ MÀU CHỦ ĐẠO (BLUE THEME) ---
  const COLORS = {
    primary: '#2563eb', // Xanh dương đậm
    secondary: '#3b82f6', // Xanh dương vừa
    light: '#eff6ff', // Xanh dương cực nhạt (background)
    success: '#10b981', // Xanh lá (Seller)
    error: '#ef4444', // Đỏ
    warning: '#f59e0b', // Vàng cam
    text: '#1e293b',
  }

  // --- STATES ---
  const [user, setUser] = useState(null)
  const [addresses, setAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [cartItems, setCartItems] = useState([])
  const [shippingMethods, setShippingMethods] = useState([])
  const [selectedShippingId, setSelectedShippingId] = useState(null)
  const [shippingFee, setShippingFee] = useState(0)
  const [paymentMethod, setPaymentMethod] = useState(1)
  const [loading, setLoading] = useState(false)

  const [coupons, setCoupons] = useState([])
  const [appliedCoupon, setAppliedCoupon] = useState(null)
  const [discountAmount, setDiscountAmount] = useState(0)
  const [showCouponModal, setShowCouponModal] = useState(false)
  const [couponApplying, setCouponApplying] = useState(false)
  const [manualCode, setManualCode] = useState('')

  // Gom nhóm tiền theo từng shop (Dùng String ID để nhất quán)
  const shopSubtotalMap = cartItems.reduce((acc, item) => {
    const sId = String(item.shop_id)
    acc[sId] = (acc[sId] ?? 0) + Number(item.price) * item.quantity
    return acc
  }, {})

  const totalProductPrice = cartItems.reduce(
    (sum, i) => sum + Number(i.price) * i.quantity,
    0
  )
  const finalTotal = Math.max(
    0,
    totalProductPrice + shippingFee - discountAmount
  )

  useEffect(() => {
    if (selectedItems.length === 0) {
      navigate('/cart')
      return
    }

    const fetchData = async () => {
      try {
        const [userRes, cartRes, addrRes, shipRes] = await Promise.all([
          axiosClient.get('/user'),
          cartApi.getCart(),
          cartApi.getAddresses().catch(() => ({ data: [] })),
          axiosClient.get('/shipping-methods').catch(() => ({ data: [] })),
        ])

        setUser(userRes.data)

        const allItems = Object.values(cartRes.data || {}).flat()
        const filtered = allItems.filter((item) =>
          selectedItems.map(String).includes(String(item.id))
        )
        setCartItems(filtered)

        const addrList = addrRes.data || []
        setAddresses(addrList)
        if (addrList.length > 0) {
          setSelectedAddress(addrList.find((a) => a.is_default) || addrList[0])
        }

        const shipList = shipRes.data || []
        setShippingMethods(shipList)
        if (shipList.length > 0) {
          setSelectedShippingId(shipList[0].id)
          setShippingFee(Number(shipList[0].base_fee))
        }

        const shopIds = Array.from(
          new Set(filtered.map((i) => i.shop_id))
        ).filter(Boolean)
        const couponRes = await axiosClient.get('/vouchers/checkout', {
          params: { shop_ids: shopIds.join(',') },
        })
        setCoupons(couponRes.data || [])
      } catch (err) {
        console.error('Load checkout error:', err)
      }
    }
    fetchData()
  }, [selectedItems, navigate])

  const handleChangeAddress = () => {
    if (addresses.length <= 1) return alert('Bạn không có địa chỉ khác')
    const currentIndex = addresses.findIndex((a) => a.id === selectedAddress.id)
    const nextIndex = (currentIndex + 1) % addresses.length
    setSelectedAddress(addresses[nextIndex])
  }

  // --- LOGIC APPLY VOUCHER (FIXED 422) ---
  const handleApplyCoupon = async (codeFromModal) => {
    if (couponApplying) return
    const code = (
      typeof codeFromModal === 'string' ? codeFromModal : manualCode
    )
      .trim()
      .toUpperCase()
    if (!code) return alert('Vui lòng nhập hoặc chọn mã')

    try {
      setCouponApplying(true)
      const cp = coupons.find((i) => i.code === code)

      // Xác định subtotal chuẩn để gửi lên Backend check min_order_value
      const isSystem = cp ? cp.shop_id === null : true // Nếu nhập tay thì mặc định check theo tổng đơn
      const subtotalToCheck =
        !isSystem && cp
          ? shopSubtotalMap[String(cp.shop_id)] || 0
          : totalProductPrice

      const res = await couponApi.applyCoupon({
        coupon_code: code,
        order_total: subtotalToCheck,
        shop_id: cp?.shop_id || null,
      })

      setAppliedCoupon(res.data)
      setDiscountAmount(Number(res.data.discount_amount) || 0)
      setShowCouponModal(false)
      setManualCode('')
      alert(
        `Áp dụng thành công! Giảm ${res.data.discount_amount.toLocaleString()}đ`
      )
    } catch (err) {
      alert(
        err.response?.data?.message || 'Mã không hợp lệ hoặc không đủ điều kiện'
      )
    } finally {
      setCouponApplying(false)
    }
  }

  const handlePlaceOrder = async () => {
    if (!selectedAddress) return alert('Vui lòng chọn địa chỉ')
    setLoading(true)
    try {
      const orderRes = await cartApi.checkout({
        cart_item_ids: selectedItems,
        address_id: selectedAddress.id,
        payment_method_id: paymentMethod,
        shipping_method_id: selectedShippingId,
        coupon_code: appliedCoupon?.code,
      })
      const { order_ids, total_amount } = orderRes.data
      if (paymentMethod === 2) {
        const res = await paymentApi.createMoMoUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        if (res.data.paymentUrl) window.location.href = res.data.paymentUrl
      } else if (paymentMethod === 3) {
        const res = await paymentApi.createVNPayUrl({
          orderId: order_ids[0],
          amount: total_amount,
        })
        if (res.data.paymentUrl) window.location.href = res.data.paymentUrl
      } else {
        alert('Đặt hàng thành công!')
        navigate('/orders')
      }
    } catch (err) {
      alert('Lỗi đặt hàng: ' + (err.response?.data?.message || 'Thử lại sau'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        background: '#f8fafc',
        minHeight: '100vh',
        padding: '30px 0',
        fontFamily: 'Segoe UI, sans-serif',
      }}
    >
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        <h2
          style={{
            color: COLORS.primary,
            marginBottom: '25px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            fontWeight: '800',
          }}
        >
          <span
            style={{
              background: COLORS.primary,
              color: '#fff',
              padding: '8px',
              borderRadius: '12px',
            }}
          >
            SH
          </span>{' '}
          Thanh toán
        </h2>

        {/* 1. ĐỊA CHỈ NHẬN HÀNG */}
        <div
          style={{
            background: '#fff',
            padding: '25px',
            marginBottom: '20px',
            borderTop: `5px solid ${COLORS.primary}`,
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: COLORS.primary,
              marginBottom: '18px',
            }}
          >
            <span style={{ fontSize: '22px' }}>📍</span>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700' }}>
              Địa chỉ nhận hàng
            </h3>
          </div>
          {selectedAddress ? (
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ color: COLORS.text }}>
                <strong style={{ fontSize: '17px' }}>
                  {selectedAddress.recipient_name} |{' '}
                  {selectedAddress.recipient_phone}
                </strong>
                <p style={{ margin: '8px 0', opacity: 0.8, fontSize: '15px' }}>
                  {selectedAddress.address_detail}, {selectedAddress.ward},{' '}
                  {selectedAddress.district}, {selectedAddress.city}
                </p>
                {selectedAddress.is_default && (
                  <span
                    style={{
                      background: COLORS.primary,
                      color: '#fff',
                      fontSize: '11px',
                      padding: '3px 10px',
                      borderRadius: '20px',
                      fontWeight: '600',
                    }}
                  >
                    MẶC ĐỊNH
                  </span>
                )}
              </div>
              <button
                onClick={handleChangeAddress}
                style={{
                  color: COLORS.primary,
                  border: `1.5px solid ${COLORS.primary}`,
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: 'transparent',
                  cursor: 'pointer',
                  fontWeight: '700',
                  transition: '0.3s',
                }}
              >
                THAY ĐỔI
              </button>
            </div>
          ) : (
            <p>Vui lòng thêm địa chỉ nhận hàng.</p>
          )}
        </div>

        {/* 2. DANH SÁCH SẢN PHẨM */}
        <div
          style={{
            background: '#fff',
            padding: '25px',
            marginBottom: '20px',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              paddingBottom: '15px',
              borderBottom: '1px solid #f1f5f9',
              color: '#64748b',
              fontWeight: '700',
              fontSize: '13px',
              textTransform: 'uppercase',
            }}
          >
            <div style={{ flex: 6 }}>Sản phẩm</div>
            <div style={{ flex: 2, textAlign: 'center' }}>Đơn giá</div>
            <div style={{ flex: 1, textAlign: 'center' }}>Số lượng</div>
            <div style={{ flex: 2, textAlign: 'right' }}>Thành tiền</div>
          </div>
          {cartItems.map((item) => (
            <div
              key={item.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                padding: '20px 0',
                borderBottom: '1px solid #f8fafc',
              }}
            >
              <div style={{ flex: 6, display: 'flex', gap: '15px' }}>
                <img
                  src={item.image}
                  style={{
                    width: '65px',
                    height: '65px',
                    objectFit: 'cover',
                    borderRadius: '10px',
                    border: '1px solid #e2e8f0',
                  }}
                  alt=""
                />
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: '15px',
                      fontWeight: '600',
                      color: COLORS.text,
                    }}
                  >
                    {item.product_name}
                  </div>
                  <div
                    style={{
                      fontSize: '13px',
                      color: '#94a3b8',
                      marginTop: '4px',
                    }}
                  >
                    Phân loại: {item.sku_code}
                  </div>
                </div>
              </div>
              <div style={{ flex: 2, textAlign: 'center', color: COLORS.text }}>
                {Number(item.price).toLocaleString()}đ
              </div>
              <div style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
                {item.quantity}
              </div>
              <div
                style={{
                  flex: 2,
                  textAlign: 'right',
                  fontWeight: '700',
                  color: COLORS.primary,
                }}
              >
                {(item.price * item.quantity).toLocaleString()}đ
              </div>
            </div>
          ))}
        </div>

        {/* 3. VẬN CHUYỂN & THANH TOÁN */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '17px',
                marginBottom: '20px',
                fontWeight: '700',
                color: COLORS.text,
              }}
            >
              🚀 Đơn vị vận chuyển
            </h3>
            {shippingMethods.map((m) => (
              <div
                key={m.id}
                onClick={() => {
                  setSelectedShippingId(m.id)
                  setShippingFee(Number(m.base_fee))
                }}
                style={{
                  padding: '15px',
                  border:
                    selectedShippingId === m.id
                      ? `2px solid ${COLORS.primary}`
                      : '1.5px solid #f1f5f9',
                  background:
                    selectedShippingId === m.id ? COLORS.light : '#fff',
                  borderRadius: '10px',
                  marginBottom: '12px',
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: '0.2s',
                }}
              >
                <span
                  style={{
                    fontWeight: selectedShippingId === m.id ? '700' : '500',
                    color: COLORS.text,
                  }}
                >
                  {m.name}
                </span>
                <span style={{ color: COLORS.primary, fontWeight: '800' }}>
                  {Number(m.base_fee).toLocaleString()}đ
                </span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#fff',
              padding: '25px',
              borderRadius: '12px',
              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
            }}
          >
            <h3
              style={{
                fontSize: '17px',
                marginBottom: '20px',
                fontWeight: '700',
                color: COLORS.text,
              }}
            >
              💳 Phương thức thanh toán
            </h3>
            <div
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              {[
                { id: 1, name: 'Thanh toán COD', icon: '💵' },
                {
                  id: 2,
                  name: 'Ví MoMo',
                  img: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
                },
                { id: 3, name: 'Cổng VNPay', img: logoVnPay },
              ].map((method) => (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id)}
                  style={{
                    padding: '15px',
                    textAlign: 'left',
                    border:
                      paymentMethod === method.id
                        ? `2px solid ${COLORS.primary}`
                        : '1.5px solid #f1f5f9',
                    background:
                      paymentMethod === method.id ? COLORS.light : '#fff',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    transition: '0.2s',
                  }}
                >
                  {method.img ? (
                    <img
                      src={method.img}
                      width="26"
                      height="26"
                      style={{ borderRadius: '6px' }}
                    />
                  ) : (
                    <span style={{ fontSize: '22px' }}>{method.icon}</span>
                  )}
                  <span
                    style={{
                      fontWeight: paymentMethod === method.id ? '700' : '500',
                      color: COLORS.text,
                    }}
                  >
                    {method.name}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 4. VOUCHER & TỔNG KẾT */}
        <div
          style={{
            background: '#fff',
            padding: '30px',
            borderRadius: '12px',
            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingBottom: '25px',
              borderBottom: '1.5px dashed #e2e8f0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ color: COLORS.primary, fontSize: '28px' }}>
                🎟️
              </span>
              <strong style={{ fontSize: '18px', color: COLORS.text }}>
                Shopii Voucher
              </strong>
            </div>

            {/* NHẬP MÃ TẠI CHỖ */}
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <input
                type="text"
                placeholder="Nhập mã ưu đãi..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                style={{
                  padding: '12px 18px',
                  border: '2px solid #f1f5f9',
                  borderRadius: '10px',
                  outline: 'none',
                  width: '220px',
                  fontSize: '14px',
                  background: '#f8fafc',
                }}
              />
              <button
                onClick={() => handleApplyCoupon()}
                style={{
                  padding: '12px 25px',
                  background: COLORS.primary,
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  transition: '0.3s',
                }}
              >
                ÁP DỤNG
              </button>
              <div
                style={{ width: '2px', height: '30px', background: '#f1f5f9' }}
              ></div>
              <button
                onClick={() => setShowCouponModal(true)}
                style={{
                  color: COLORS.primary,
                  border: 'none',
                  background: 'none',
                  cursor: 'pointer',
                  fontWeight: '700',
                  textDecoration: 'none',
                  fontSize: '15px',
                }}
              >
                CHỌN MÃ
              </button>
            </div>
          </div>

          {appliedCoupon && (
            <div
              style={{
                marginTop: '20px',
                background: '#f0fdf4',
                color: '#166534',
                padding: '15px 20px',
                borderRadius: '10px',
                border: '1px solid #bbf7d0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span style={{ fontWeight: '600' }}>
                ✨ Đã kích hoạt mã:{' '}
                <span style={{ color: COLORS.primary }}>
                  {appliedCoupon.code}
                </span>
              </span>
              <button
                onClick={() => {
                  setAppliedCoupon(null)
                  setDiscountAmount(0)
                }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: COLORS.error,
                  cursor: 'pointer',
                  fontWeight: '700',
                  fontSize: '13px',
                }}
              >
                GỠ BỎ
              </button>
            </div>
          )}

          <div style={{ textAlign: 'right', marginTop: '30px' }}>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr auto',
                gap: '12px 40px',
                justifyContent: 'end',
                alignItems: 'center',
              }}
            >
              <span style={{ color: '#64748b' }}>Tổng tiền hàng:</span>
              <span style={{ fontWeight: '600', color: COLORS.text }}>
                {totalProductPrice.toLocaleString()}đ
              </span>

              <span style={{ color: '#64748b' }}>Phí vận chuyển:</span>
              <span style={{ fontWeight: '600', color: COLORS.text }}>
                {shippingFee.toLocaleString()}đ
              </span>

              {discountAmount > 0 && (
                <>
                  <span style={{ color: COLORS.error }}>Giảm giá Voucher:</span>
                  <span style={{ fontWeight: '700', color: COLORS.error }}>
                    -{discountAmount.toLocaleString()}đ
                  </span>
                </>
              )}

              <span
                style={{
                  fontSize: '18px',
                  fontWeight: '700',
                  marginTop: '10px',
                }}
              >
                Tổng thanh toán:
              </span>
              <span
                style={{
                  fontSize: '32px',
                  color: COLORS.primary,
                  fontWeight: '900',
                  marginTop: '10px',
                }}
              >
                {finalTotal.toLocaleString()}đ
              </span>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={loading}
              style={{
                marginTop: '30px',
                padding: '18px 100px',
                background: COLORS.primary,
                color: '#fff',
                border: 'none',
                borderRadius: '12px',
                cursor: 'pointer',
                fontSize: '18px',
                fontWeight: '800',
                boxShadow: '0 10px 15px -3px rgba(37, 99, 235, 0.3)',
                transition: '0.3s',
              }}
            >
              {loading ? 'ĐANG XỬ LÝ...' : 'ĐẶT HÀNG NGAY'}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL CHỌN VOUCHER - BLUE PREMIUM */}
      {showCouponModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              background: '#fff',
              padding: '35px',
              width: '580px',
              borderRadius: '20px',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '25px',
                alignItems: 'center',
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: COLORS.primary,
                  fontSize: '22px',
                  fontWeight: '800',
                }}
              >
                Kho Voucher Của Bạn
              </h3>
              <button
                onClick={() => setShowCouponModal(false)}
                style={{
                  border: 'none',
                  background: '#f1f5f9',
                  width: '35px',
                  height: '35px',
                  borderRadius: '50%',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  color: '#64748b',
                }}
              >
                ✕
              </button>
            </div>

            {coupons.length === 0 ? (
              <p
                style={{
                  textAlign: 'center',
                  padding: '50px',
                  color: '#94a3b8',
                }}
              >
                Bạn chưa có mã giảm giá nào.
              </p>
            ) : (
              coupons.map((cp) => {
                const isSystem = cp.shop_id === null
                const subtotal = isSystem
                  ? totalProductPrice
                  : shopSubtotalMap[String(cp.shop_id)] || 0

                const isExpired = new Date(cp.end_date) < new Date()
                const isOutOfStock = cp.usage_limit <= 0
                const isNotEligible = subtotal < Number(cp.min_order_value)
                const isTierLocked =
                  cp.membership_tier_id &&
                  Number(user?.membership?.tier?.min_spent || 0) <
                    Number(cp.tier?.min_spent || 0)
                const isError =
                  isExpired || isOutOfStock || isTierLocked || isNotEligible

                return (
                  <div
                    key={cp.id}
                    style={{
                      display: 'flex',
                      border: isError
                        ? '1.5px solid #f1f5f9'
                        : `1.5px solid ${COLORS.primary}`,
                      marginBottom: '18px',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      background: isError ? '#fcfcfc' : '#fff',
                      transition: '0.2s',
                    }}
                  >
                    <div
                      style={{
                        width: '130px',
                        background: isError
                          ? '#cbd5e1'
                          : isSystem
                            ? COLORS.primary
                            : COLORS.success,
                        color: '#fff',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        textAlign: 'center',
                        padding: '15px',
                      }}
                    >
                      <strong
                        style={{ fontSize: '12px', letterSpacing: '1px' }}
                      >
                        {isSystem ? 'SHOPII' : 'SELLER'}
                      </strong>
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: '700',
                          marginTop: '4px',
                        }}
                      >
                        EXCLUSIVE
                      </span>
                    </div>

                    <div style={{ flex: 1, padding: '18px' }}>
                      <div
                        style={{
                          fontWeight: '800',
                          fontSize: '17px',
                          color: isError ? '#94a3b8' : '#1e293b',
                        }}
                      >
                        {cp.code}
                      </div>
                      <div
                        style={{
                          fontSize: '15px',
                          color: isError ? '#94a3b8' : COLORS.primary,
                          fontWeight: '700',
                          margin: '6px 0',
                        }}
                      >
                        Giảm{' '}
                        {cp.discount_type === 'percent'
                          ? `${cp.discount_value}%`
                          : `${cp.discount_value.toLocaleString()}đ`}
                      </div>
                      <div
                        style={{
                          fontSize: '12px',
                          color: '#64748b',
                          fontWeight: '500',
                        }}
                      >
                        Đơn tối thiểu:{' '}
                        <strong>
                          {Number(cp.min_order_value).toLocaleString()}đ
                        </strong>
                      </div>

                      {/* HIỂN THỊ LÝ DO KHOÁ MÃ */}
                      <div style={{ marginTop: '10px' }}>
                        {isExpired && (
                          <span
                            style={{
                              color: COLORS.error,
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            🛑 ĐÃ HẾT HẠN
                          </span>
                        )}
                        {!isExpired && isOutOfStock && (
                          <span
                            style={{
                              color: COLORS.error,
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            🛑 HẾT LƯỢT SỬ DỤNG
                          </span>
                        )}
                        {isTierLocked && (
                          <span
                            style={{
                              color: COLORS.secondary,
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            🔒 CHỈ DÀNH CHO HẠNG {cp.tier?.name}
                          </span>
                        )}
                        {!isExpired && !isOutOfStock && isNotEligible && (
                          <span
                            style={{
                              color: COLORS.warning,
                              fontSize: '11px',
                              fontWeight: '700',
                            }}
                          >
                            ⚠️ CẦN MUA THÊM{' '}
                            {(
                              Number(cp.min_order_value) - subtotal
                            ).toLocaleString()}
                            đ
                          </span>
                        )}
                      </div>
                    </div>

                    <div
                      style={{
                        padding: '20px',
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <button
                        disabled={isError || couponApplying}
                        onClick={() => handleApplyCoupon(cp.code)}
                        style={{
                          padding: '10px 22px',
                          background: isError ? '#f1f5f9' : COLORS.primary,
                          color: isError ? '#94a3b8' : '#fff',
                          border: 'none',
                          borderRadius: '8px',
                          cursor: isError ? 'not-allowed' : 'pointer',
                          fontWeight: '800',
                          fontSize: '13px',
                        }}
                      >
                        DÙNG
                      </button>
                    </div>
                  </div>
                )
              })
            )}
            <button
              onClick={() => setShowCouponModal(false)}
              style={{
                width: '100%',
                padding: '14px',
                marginTop: '15px',
                borderRadius: '10px',
                border: '2px solid #f1f5f9',
                background: '#fff',
                cursor: 'pointer',
                fontWeight: '700',
                color: '#64748b',
              }}
            >
              ĐÓNG
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default CheckoutPage
