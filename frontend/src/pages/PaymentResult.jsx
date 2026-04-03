import React, { useEffect, useRef, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import paymentApi from '../api/paymentApi'

const PaymentResult = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [isUpdating, setIsUpdating] = useState(false)
  const [updateSuccess, setUpdateSuccess] = useState(false)

  // ==========================================
  // 1. NHẬN DIỆN PARAM CỦA MOMO
  // ==========================================
  const resultCode = searchParams.get('resultCode')
  const rawOrderId = searchParams.get('orderId')
  const momoOrderId = rawOrderId ? rawOrderId.split('_')[0] : null
  const isMomoSuccess = resultCode === '0'

  // ==========================================
  // 2. NHẬN DIỆN PARAM CỦA VNPAY (Từ Backend đá về)
  // ==========================================
  const vnpayStatus = searchParams.get('status') // 'success', 'failed', 'invalid'
  const isVnpaySuccess = vnpayStatus === 'success'

  // ==========================================
  // TỔNG HỢP KẾT QUẢ
  // ==========================================
  const isSuccess = isMomoSuccess || isVnpaySuccess
  // const isFailed =
  //   (resultCode && resultCode !== '0') ||
  //   (vnpayStatus && vnpayStatus !== 'success')
  const isNotFound = !resultCode && !vnpayStatus

  const queryString = window.location.search
  const isCalled = useRef(false)

  useEffect(() => {
    const processPayment = async () => {
      setIsUpdating(true)
      try {
        if (resultCode) {
          // Nếu là MoMo: Cần gọi API xuống Backend để check chữ ký và cập nhật DB
          await paymentApi.momoReturn(queryString)
        }
        // Nếu là VNPay: Backend đã tự cập nhật DB trước khi đá về đây rồi, không cần gọi API nữa!

        setUpdateSuccess(true)
        // Xóa giỏ hàng sau khi mua thành công
        localStorage.removeItem('CART')
        window.dispatchEvent(new Event('storage'))
      } catch (err) {
        console.error('Update order error:', err)
      } finally {
        setIsUpdating(false)
      }
    }

    // Chỉ chạy 1 lần khi giao dịch thành công
    if (isSuccess && !isCalled.current) {
      isCalled.current = true
      processPayment()
    }
  }, [isSuccess, resultCode, queryString])

  return (
    <div
      style={{
        minHeight: '70vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f6f6f6',
      }}
    >
      <div
        style={{
          background: 'white',
          padding: '40px',
          borderRadius: '12px',
          width: '420px',
          textAlign: 'center',
          boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
        }}
      >
        {isNotFound ? (
          <>
            <div style={{ fontSize: '60px', color: '#94a3b8' }}>❓</div>
            <h2 style={{ marginTop: '10px' }}>Không tìm thấy giao dịch</h2>
            <p style={{ marginTop: '10px', color: '#666' }}>
              Vui lòng kiểm tra lại đơn hàng của bạn.
            </p>
          </>
        ) : isSuccess ? (
          <>
            <div style={{ fontSize: '60px', color: '#22c55e' }}>✅</div>
            <h2 style={{ marginTop: '10px' }}>Thanh toán thành công</h2>

            {momoOrderId && (
              <p style={{ marginTop: '10px', color: '#666' }}>
                Mã đơn hàng: <b>{momoOrderId}</b>
              </p>
            )}

            {isUpdating && (
              <p style={{ color: '#ee4d2d', marginTop: '10px' }}>
                ⏳ Đang đồng bộ dữ liệu...
              </p>
            )}

            {updateSuccess && (
              <p
                style={{
                  color: 'green',
                  marginTop: '10px',
                  fontWeight: 'bold',
                }}
              >
                ✔ Đã ghi nhận thanh toán
              </p>
            )}

            <button
              onClick={() => navigate('/orders')}
              style={{
                marginTop: '25px',
                padding: '12px 25px',
                background: '#ee4d2d',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                width: '100%',
                fontWeight: 'bold',
              }}
            >
              Xem đơn mua
            </button>
          </>
        ) : (
          <>
            <div style={{ fontSize: '60px', color: '#ef4444' }}>❌</div>
            <h2 style={{ marginTop: '10px' }}>Thanh toán thất bại</h2>

            {momoOrderId && (
              <p style={{ marginTop: '10px', color: '#666' }}>
                Mã đơn hàng: <b>{momoOrderId}</b>
              </p>
            )}

            <p style={{ marginTop: '5px', color: '#999' }}>
              {vnpayStatus === 'invalid'
                ? 'Giao dịch có dấu hiệu bất thường (Sai chữ ký).'
                : 'Giao dịch bị hủy hoặc xảy ra lỗi trong quá trình xử lý.'}
            </p>

            <button
              onClick={() => navigate('/')}
              style={{
                marginTop: '25px',
                padding: '12px 25px',
                background: '#333',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '15px',
                width: '100%',
                fontWeight: 'bold',
              }}
            >
              Tiếp tục mua sắm
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default PaymentResult
