import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import orderProcessingApi from '../api/orderProcessingApi'
import chatApi from '../api/chatApi'
import axiosClient from '../api/axiosClient' // Import thêm axiosClient
import OrderHistoryTable from '../components/Order/OrderHistoryTable'

export default function OrderHistoryPageV2() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState(null)
  const navigate = useNavigate()

  const fetchOrders = async () => {
    try {
      setErrorMessage(null)
      setLoading(true)
      const res = await orderProcessingApi.getOrderHistories()
      setOrders(Array.isArray(res.data) ? res.data : [])
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || 'Lỗi tải đơn hàng.')
      setOrders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  // LOGIC GIỮ LẠI TỪ FILE CŨ
  const handleConfirmReceipt = async (orderId) => {
    if (
      !window.confirm('Bạn xác nhận đã nhận được kiện hàng này nguyên vẹn chứ?')
    )
      return
    try {
      await axiosClient.put(`/orders/${orderId}/complete`)
      alert('Cảm ơn bạn đã mua sắm! Đơn hàng đã được hoàn thành.')
      fetchOrders() // Load lại danh sách
    } catch (error) {
      console.error('Lỗi khi xác nhận nhận hàng:', error)
      alert(
        error?.response?.data?.message || 'Có lỗi xảy ra, vui lòng thử lại sau!'
      )
    }
  }

  const handleChatWithShop = async (shopId) => {
    try {
      const res = await chatApi.createConversation(shopId)
      const conversationId = res.data?.id
      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`)
      }
    } catch (err) {
      alert(err?.response?.data?.message || 'Không thể tạo cuộc trò chuyện.')
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
    <div>
      {errorMessage && (
        <div style={{ maxWidth: 1000, margin: '15px auto', padding: '0 15px' }}>
          <div
            style={{
              background: '#fee2e2',
              color: '#991b1b',
              padding: 12,
              borderRadius: 8,
            }}
          >
            {errorMessage}
          </div>
        </div>
      )}
      {/* TRUYỀN THÊM PROP onConfirmReceipt */}
      <OrderHistoryTable
        orders={orders}
        onChatWithShop={handleChatWithShop}
        onConfirmReceipt={handleConfirmReceipt}
      />
    </div>
  )
}
