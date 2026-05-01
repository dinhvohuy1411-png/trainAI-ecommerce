import React, { useState } from 'react'
import ReviewSection from '../../pages/Review' // Đảm bảo đường dẫn import này đúng với cấu trúc thư mục của bạn

function translateStatus(status) {
  switch (status) {
    case 'pending':
      return 'Chờ Xác Nhận'
    case 'confirmed':
      return 'Đã Xác Nhận'
    case 'shipping':
      return 'Đang Giao'
    case 'completed':
      return 'Hoàn Thành'
    case 'cancelled':
      return 'Đã Hủy'
    default:
      return status || ''
  }
}

function translatePaymentStatus(status) {
  return status === 'paid' ? 'Đã Thanh Toán' : 'Chưa Thanh Toán'
}

function getStatusColor(status) {
  if (status === 'completed') return '#26aa99'
  if (status === 'cancelled') return '#888'
  if (status === 'confirmed') return '#3b82f6'
  return '#ee4d2d'
}

export default function OrderHistoryTable({
  orders,
  onChatWithShop,
  onConfirmReceipt,
  onReviewProduct,
}) {
  const orderList = Array.isArray(orders) ? orders : []
  
  // State để quản lý việc hiển thị modal đánh giá
  const [reviewData, setReviewData] = useState(null)

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

        {orderList.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              backgroundColor: 'white',
              padding: '60px 0',
              borderRadius: '2px',
              boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
            }}
          >
            <img
              src="https://deo.shopeemobile.com/shopee/shopee-pcmall-live-sg/orderlist/5fafbb923393b712b964.png"
              alt="Empty Order"
              style={{ width: '100px', marginBottom: '20px' }}
            />
            <p style={{ color: '#555', fontSize: '16px' }}>
              Chưa có đơn hàng nào.
            </p>
          </div>
        ) : (
          orderList.map((order) => (
            <div
              key={order.id}
              style={{
                backgroundColor: 'white',
                marginBottom: '15px',
                borderRadius: '2px',
                boxShadow: '0 1px 1px rgba(0,0,0,0.05)',
              }}
            >
              {/* Header: Shop & Trạng thái */}
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

              {/* Items */}
              <div>
                {(order.items || []).map((item) => (
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
                          item.sku?.product?.product_images?.[0]?.image_url ||
                          item.sku?.product?.product_images?.[0]?.image_path ||
                          'https://placehold.co/150x150?text=No+Image'
                        }
                        alt={item.sku?.product?.name}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: '15px',
                          marginBottom: '5px',
                          color: '#333',
                          lineHeight: '1.4',
                        }}
                      >
                        {item.sku?.product?.name || 'Sản phẩm không xác định'}
                      </div>
                      <div
                        style={{
                          color: '#888',
                          fontSize: '13px',
                          marginBottom: '5px',
                        }}
                      >
                        Phân loại: {item.sku?.sku || 'Mặc định'}
                      </div>
                      <div style={{ fontSize: '13px' }}>x{item.quantity}</div>
                    </div>

                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#ee4d2d', fontSize: '15px' }}>
                        ₫{Number(item.price || 0).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Histories */}
              <div
                style={{ padding: '15px 20px', borderTop: '1px solid #f0f0f0' }}
              >
                <strong style={{ display: 'block', marginBottom: 8 }}>
                  Lịch sử trạng thái
                </strong>

                {(order.histories || []).length === 0 ? (
                  <div style={{ color: '#888', fontSize: '14px' }}>
                    Chưa có lịch sử cập nhật.
                  </div>
                ) : (
                  <div style={{ display: 'grid', rowGap: 8 }}>
                    {(order.histories || []).map((h, idx) => (
                      <div
                        key={`${h.id || idx}`}
                        style={{
                          background: '#f8fafc',
                          border: '1px solid #eef2f7',
                          padding: '10px 12px',
                          borderRadius: 8,
                        }}
                      >
                        {/* --- SỬA LẠI CHỖ NÀY --- */}
                        <div
                          style={{
                            fontWeight: 600,
                            color: getStatusColor(h.status),
                          }}
                        >
                          {translateStatus(h.status)}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#475569',
                            marginTop: '4px',
                          }}
                        >
                          Ghi chú: {h.note || 'Không có'}
                        </div>
                        <div
                          style={{
                            fontSize: 12,
                            color: '#94a3b8',
                            marginTop: '2px',
                          }}
                        >
                          {h.created_at
                            ? new Date(h.created_at).toLocaleString()
                            : ''}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
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
                    ₫{Number(order.final_total || 0).toLocaleString()}
                  </span>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    gap: '10px',
                    flexWrap: 'wrap',
                  }}
                >
                  {order.status === 'shipping' && (
                    <button
                      onClick={() =>
                        onConfirmReceipt && onConfirmReceipt(order.id)
                      }
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
                  {order.status === 'completed' && (
                    <button
                      onClick={() => {
                        // Gọi hàm prop cũ (nếu bạn vẫn cần dùng ở component cha)
                        if (onReviewProduct) onReviewProduct(order.id);
                        
                        // Lấy ID của sản phẩm đầu tiên trong đơn hàng để truyền vào ReviewSection
                        const firstProductId = order.items?.[0]?.sku?.product?.id;
                        
                        // Mở Modal Đánh giá
                        setReviewData({
                          orderId: order.id,
                          productId: firstProductId
                        });
                      }}
                      style={{
                        background: '#fff',
                        color: '#ee4d2d',
                        padding: '10px 20px',
                        border: '1px solid #ee4d2d',
                        borderRadius: '2px',
                        cursor: 'pointer',
                        minWidth: '150px',
                        fontWeight: '500',
                      }}
                    >
                      Đánh Giá Sản Phẩm
                    </button>
                  )}

                  {typeof onChatWithShop === 'function' && order.shop?.id && (
                    <button
                      onClick={() => onChatWithShop(order.shop.id)}
                      style={{
                        minWidth: '150px',
                        padding: '10px 0',
                        border: '1px solid #ddd',
                        background: 'white',
                        color: '#555',
                        borderRadius: '2px',
                        cursor: 'pointer',
                      }}
                    >
                      Chat với Shop
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* --- MODAL REVIEW SECTION --- */}
      {reviewData && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 9999,
          }}
          onClick={() => setReviewData(null)} // Bấm ra ngoài để đóng
        >
          <div
            style={{
              backgroundColor: '#fff',
              padding: '20px',
              borderRadius: '8px',
              width: '90%',
              maxWidth: '500px',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()} // Ngăn sự kiện đóng khi bấm vào form
          >
            {/* Nút đóng Modal */}
            <button
              onClick={() => setReviewData(null)}
              style={{
                position: 'absolute',
                top: '15px',
                right: '15px',
                background: 'transparent',
                border: 'none',
                fontSize: '18px',
                cursor: 'pointer',
                color: '#888',
              }}
            >
              ✖
            </button>

            {/* Render Component ReviewSection */}
            <ReviewSection
              orderId={reviewData.orderId}
              productId={reviewData.productId}
              // Lưu ý: Đảm bảo token được truyền đúng cách (từ localStorage hoặc AuthContext của bạn)
              token={localStorage.getItem('token') || ''} 
            />
          </div>
        </div>
      )}
    </div>
  )
}