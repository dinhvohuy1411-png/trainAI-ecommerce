import React, { useEffect, useState } from 'react'
import orderApi from '../api/orderApi'
import axiosClient from '../api/axiosClient'
import { Link, useNavigate } from 'react-router-dom'

const OrderHistoryPage = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  const handleViewShop = (shopId) => {
    if (shopId) {
      navigate(`/shop/${shopId}`)
    } else {
      console.warn('Không tìm thấy Shop ID')
    }
  }

  const fetchOrders = async () => {
    try {
      setLoading(true)
      const res = await orderApi.getMyOrders()
      setOrders(res.data || [])
    } catch (error) {
      console.error('Lỗi tải đơn hàng:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  const handleConfirmReceipt = async (orderId) => {
    if (
      !window.confirm('Bạn xác nhận đã nhận được kiện hàng này nguyên vẹn chứ?')
    )
      return

    try {
      await axiosClient.put(`/orders/${orderId}/complete`)
      alert('Cảm ơn bạn đã mua sắm! Đơn hàng đã được hoàn thành.')
      fetchOrders()
    } catch (error) {
      console.error('Lỗi khi xác nhận nhận hàng:', error)
      alert('Có lỗi xảy ra, vui lòng thử lại sau!')
    }
  }

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '60vh',
          backgroundColor: '#f5f5f5',
        }}
      >
        <div
          className="spinner"
          style={{
            width: '40px',
            height: '40px',
            border: '4px solid #ddd',
            borderTop: '4px solid #ee4d2d',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }}
        ></div>
      </div>
    )
  }

  return (
    <div
      style={{
        backgroundColor: '#f5f5f5',
        minHeight: '100vh',
        padding: '20px 0',
        fontFamily: 'Arial, sans-serif',
      }}
    >
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 15px' }}>
        <div
          style={{
            backgroundColor: 'white',
            padding: '15px 20px',
            borderRadius: '2px',
            marginBottom: '15px',
            boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
          }}
        >
          <h2
            style={{
              margin: 0,
              color: '#333',
              fontSize: '18px',
              textTransform: 'uppercase',
            }}
          >
            Đơn hàng của tôi
          </h2>
        </div>

        {orders.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              backgroundColor: 'white',
              padding: '60px 0',
              borderRadius: '2px',
            }}
          >
            <img
              src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/orderlist/5fafbb923393b712b964.png"
              alt="Empty"
              style={{ width: '100px', marginBottom: '20px' }}
            />
            <p style={{ color: '#555', fontSize: '16px' }}>
              Chưa có đơn hàng nào.
            </p>
            <Link
              to="/"
              style={{
                display: 'inline-block',
                marginTop: '10px',
                padding: '10px 30px',
                backgroundColor: '#672dee',
                color: 'white',
                textDecoration: 'none',
                borderRadius: '2px',
              }}
            >
              MUA SẮM NGAY
            </Link>
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: 'white',
                marginBottom: '15px',
                borderRadius: '2px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '15px 20px',
                  borderBottom: '1px solid #eaeaea',
                }}
              >
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <strong style={{ fontSize: '14px' }}>
                    {order.shop?.name || 'Shopii Mall'}
                  </strong>
                  <button
                    onClick={() => handleViewShop(order.shop?.id)}
                    style={{
                      fontSize: '12px',
                      padding: '4px 8px',
                      border: '1px solid #ddd',
                      background: 'white',
                      cursor: 'pointer',
                    }}
                  >
                    Xem Shop
                  </button>
                </div>
                <div
                  style={{ display: 'flex', alignItems: 'center', gap: '10px' }}
                >
                  <span
                    style={{
                      color: getStatusColor(order.status),
                      textTransform: 'uppercase',
                      fontSize: '13px',
                      fontWeight: 'bold',
                    }}
                  >
                    {translateStatus(order.status)}
                  </span>
                  <span style={{ color: '#ddd' }}>|</span>
                  <span
                    style={{
                      color: '#26aa99',
                      textTransform: 'uppercase',
                      fontSize: '13px',
                    }}
                  >
                    {translatePaymentStatus(order.payment_status)}
                  </span>
                </div>
              </div>

              {/* Items List */}
              <div>
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      padding: '15px 20px',
                      borderBottom: '1px solid #eaeaea',
                      alignItems: 'flex-start',
                    }}
                  >
                    <div
                      style={{
                        width: '80px',
                        height: '80px',
                        flexShrink: 0,
                        border: '1px solid #e1e1e1',
                        marginRight: '15px',
                      }}
                    >
                      <img
                        src={
                          item.sku?.product?.image ||
                          'https://via.placeholder.com/150'
                        }
                        alt="product"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '15px', color: '#333' }}>
                        {item.sku?.product?.name || 'Sản phẩm không xác định'}
                      </div>
                      <div style={{ color: '#888', fontSize: '13px' }}>
                        Phân loại: {item.sku?.sku || 'Mặc định'}
                      </div>
                      <div style={{ fontSize: '13px' }}>x{item.quantity}</div>
                    </div>
                    <div
                      style={{
                        textAlign: 'right',
                        color: '#ee4d2d',
                        fontSize: '15px',
                      }}
                    >
                      ₫{Number(item.price).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer: Tổng tiền & Nút bấm */}
              <div style={{ padding: '20px', backgroundColor: '#fffefb' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center',
                    marginBottom: '20px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#333',
                      marginRight: '10px',
                    }}
                  >
                    Thành tiền:
                  </span>
                  <span
                    style={{
                      fontSize: '20px',
                      color: '#ee4d2d',
                      fontWeight: 'bold',
                    }}
                  >
                    ₫{Number(order.final_total).toLocaleString()}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                  }}
                >
                  {/* --- NÚT ĐÃ NHẬN HÀNG ĐƯỢC CHÈN Ở ĐÂY --- */}
                  {order.status === 'shipping' && (
                    <button
                      onClick={() => handleConfirmReceipt(order.id)}
                      style={{
                        background: '#ee4d2d',
                        color: 'white',
                        padding: '10px 20px',
                        border: 'none',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        minWidth: '150px',
                        fontWeight: '500',
                      }}
                    >
                      Đã Nhận Được Hàng
                    </button>
                  )}

                  <button
                    style={{
                      minWidth: '150px',
                      padding: '10px 0',
                      border: '1px solid #ddd',
                      background: 'white',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Mua Lại
                  </button>

                  <button
                    style={{
                      minWidth: '150px',
                      padding: '10px 0',
                      border: '1px solid #ddd',
                      background: 'white',
                      borderRadius: '2px',
                      cursor: 'pointer',
                    }}
                  >
                    Liên Hệ Shop
                  </button>

                  {order.status === 'pending' && (
                    <button
                      style={{
                        minWidth: '150px',
                        padding: '10px 0',
                        border: '1px solid #ddd',
                        background: 'white',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Hủy Đơn Hàng
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

// Helper Functions
const translateStatus = (status) => {
  const map = {
    pending: 'Chờ Xác Nhận',
    confirmed: 'Chờ Lấy Hàng',
    shipping: 'Đang Giao',
    completed: 'Hoàn Thành',
    cancelled: 'Đã Hủy',
    refunded: 'Đã Hoàn Tiền',
  }
  return map[status] || status
}
const translatePaymentStatus = (status) =>
  status === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'
const getStatusColor = (status) =>
  status === 'completed'
    ? '#26aa99'
    : status === 'cancelled'
      ? '#888'
      : '#ee4d2d'

export default OrderHistoryPage
