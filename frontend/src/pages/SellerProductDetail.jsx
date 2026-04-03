import React from 'react'
import { useParams } from 'react-router-dom'
import AiForecastWidget from '../components/AiForecastWidget'

const SellerProductDetail = () => {
  // Lấy ID sản phẩm từ trên thanh URL (ví dụ: /seller/products/5)
  // Nếu nhóm bạn chưa làm Router thì bạn có thể gán cứng `const id = 1;` để test luôn.
  const { id } = useParams()

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: '900px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <div
        style={{
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '8px',
          marginBottom: '20px',
        }}
      >
        <h2 style={{ marginTop: 0 }}>Trang Chi tiết Sản phẩm (Demo)</h2>
        <p style={{ color: '#666' }}>
          Mô phỏng giao diện của người bán. Đang xem dữ liệu của Sản phẩm ID:{' '}
          <strong>{id}</strong>
        </p>
        <p style={{ fontSize: '14px', color: '#888' }}>
          (Phần thông tin mô tả, giá cả, hình ảnh sản phẩm do bạn khác làm sẽ
          nằm ở đây...)
        </p>
      </div>

      {/* ĐÂY LÀ KHU VỰC CỦA NHÂN: Nhúng AI Widget vào và truyền ID xuống */}
      <AiForecastWidget productId={id} />
    </div>
  )
}

export default SellerProductDetail
