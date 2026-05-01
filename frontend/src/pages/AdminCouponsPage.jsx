import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [tiers, setTiers] = useState([])
  const [formData, setFormData] = useState({
    code: '',
    membership_tier_id: '',
    discount_type: 'fixed',
    discount_value: '',
    min_order_value: 0,
    max_discount_value: '',
    usage_limit: '',
    start_date: '',
    end_date: '',
  })

  const primaryColor = '#2563eb' // Màu xanh dương chủ đạo

  useEffect(() => {
    fetchCoupons()
    fetchTiers()
  }, [])

  const fetchCoupons = () =>
    axiosClient.get('/admin/coupons').then((res) => setCoupons(res.data))
  const fetchTiers = () =>
    axiosClient.get('/membership-tiers').then((res) => setTiers(res.data))

  const handleSubmit = (e) => {
    e.preventDefault()
    axiosClient
      .post('/admin/coupons', formData)
      .then(() => {
        alert('Tạo mã thành công!')
        fetchCoupons()
        setFormData({
          code: '',
          membership_tier_id: '',
          discount_type: 'fixed',
          discount_value: '',
          min_order_value: 0,
          max_discount_value: '',
          usage_limit: '',
          start_date: '',
          end_date: '',
        })
      })
      .catch((err) => alert(err.response?.data?.message || 'Lỗi tạo mã'))
  }

  const deleteCoupon = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa mã toàn sàn này?')) {
      axiosClient.delete(`/admin/coupons/${id}`).then(() => fetchCoupons())
    }
  }

  return (
    <div
      style={{
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2
        style={{
          color: primaryColor,
          marginBottom: '25px',
          borderBottom: `2px solid ${primaryColor}`,
          paddingBottom: '10px',
        }}
      >
        🎟️ Quản lý Coupon Hệ Thống
      </h2>

      {/* FORM TẠO MÃ ĐẦY ĐỦ THÔNG TIN */}
      <div
        style={{
          background: '#fff',
          padding: '25px',
          borderRadius: '12px',
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          marginBottom: '30px',
        }}
      >
        <h4 style={{ marginTop: 0, color: '#444' }}>
          + Phát hành mã giảm giá mới
        </h4>
        <form
          onSubmit={handleSubmit}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '15px',
          }}
        >
          <div className="field">
            <label style={labelStyle}>Mã Coupon</label>
            <input
              style={inputStyle}
              type="text"
              placeholder="VD: VIP2026"
              value={formData.code}
              onChange={(e) =>
                setFormData({ ...formData, code: e.target.value.toUpperCase() })
              }
              required
            />
          </div>
          <div className="field">
            <label style={labelStyle}>Hạng yêu cầu</label>
            <select
              style={inputStyle}
              value={formData.membership_tier_id}
              onChange={(e) =>
                setFormData({ ...formData, membership_tier_id: e.target.value })
              }
            >
              <option value="">Tất cả thành viên</option>
              {tiers.map((t) => (
                <option key={t.id} value={t.id}>
                  Hạng {t.name} trở lên
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label style={labelStyle}>Loại giảm giá</label>
            <select
              style={inputStyle}
              value={formData.discount_type}
              onChange={(e) =>
                setFormData({ ...formData, discount_type: e.target.value })
              }
            >
              <option value="fixed">Giảm tiền cố định (đ)</option>
              <option value="percent">Giảm theo phần trăm (%)</option>
            </select>
          </div>
          <div className="field">
            <label style={labelStyle}>Giá trị giảm</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="Số tiền hoặc %"
              value={formData.discount_value}
              onChange={(e) =>
                setFormData({ ...formData, discount_value: e.target.value })
              }
              required
            />
          </div>
          <div className="field">
            <label style={labelStyle}>Đơn tối thiểu (Min Order)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="Số tiền tối thiểu"
              value={formData.min_order_value}
              onChange={(e) =>
                setFormData({ ...formData, min_order_value: e.target.value })
              }
              required
            />
          </div>
          <div className="field">
            <label style={labelStyle}>Giảm tối đa (Max Discount)</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="Để trống nếu không giới hạn"
              value={formData.max_discount_value}
              onChange={(e) =>
                setFormData({ ...formData, max_discount_value: e.target.value })
              }
            />
          </div>
          <div className="field">
            <label style={labelStyle}>Số lượt dùng</label>
            <input
              style={inputStyle}
              type="number"
              placeholder="Tổng lượt xài"
              value={formData.usage_limit}
              onChange={(e) =>
                setFormData({ ...formData, usage_limit: e.target.value })
              }
              required
            />
          </div>
          <div className="field"></div> {/* Spacer */}
          <div className="field">
            <label style={labelStyle}>Ngày bắt đầu</label>
            <input
              style={inputStyle}
              type="datetime-local"
              value={formData.start_date}
              onChange={(e) =>
                setFormData({ ...formData, start_date: e.target.value })
              }
              required
            />
          </div>
          <div className="field">
            <label style={labelStyle}>Ngày kết thúc</label>
            <input
              style={inputStyle}
              type="datetime-local"
              value={formData.end_date}
              onChange={(e) =>
                setFormData({ ...formData, end_date: e.target.value })
              }
              required
            />
          </div>
          <button
            type="submit"
            style={{
              gridColumn: 'span 2',
              padding: '12px',
              background: primaryColor,
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              alignSelf: 'flex-end',
              fontSize: '16px',
            }}
          >
            XÁC NHẬN PHÁT HÀNH TOÀN SÀN
          </button>
        </form>
      </div>

      {/* DANH SÁCH MÃ ĐANG HOẠT ĐỘNG */}
      <div
        style={{
          background: '#fff',
          borderRadius: '12px',
          boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr
              style={{
                background: primaryColor,
                color: '#fff',
                textAlign: 'left',
              }}
            >
              <th style={thStyle}>Mã</th>
              <th style={thStyle}>Đối tượng</th>
              <th style={thStyle}>Chi tiết giảm</th>
              <th style={thStyle}>Điều kiện đơn</th>
              <th style={thStyle}>Lượt dùng</th>
              <th style={thStyle}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {coupons.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #eee' }}>
                <td
                  style={{
                    padding: '15px',
                    fontWeight: 'bold',
                    color: primaryColor,
                  }}
                >
                  {c.code}
                </td>
                <td style={{ padding: '15px' }}>
                  {c.tier?.name ? `💎 ${c.tier.name}+` : '🔓 Mọi người'}
                </td>
                <td style={{ padding: '15px' }}>
                  {c.discount_type === 'fixed'
                    ? `${Number(c.discount_value).toLocaleString()}đ`
                    : `${c.discount_value}%`}
                  {c.max_discount_value > 0 && (
                    <div style={{ fontSize: '11px', color: '#888' }}>
                      (Tối đa {Number(c.max_discount_value).toLocaleString()}đ)
                    </div>
                  )}
                </td>
                <td style={{ padding: '15px' }}>
                  Từ{' '}
                  <strong>{Number(c.min_order_value).toLocaleString()}đ</strong>
                </td>
                <td style={{ padding: '15px' }}>{c.usage_limit} mã</td>
                <td style={{ padding: '15px' }}>
                  <button
                    onClick={() => deleteCoupon(c.id)}
                    style={{
                      color: 'red',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                    }}
                  >
                    Gỡ bỏ
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// Inline Styles
const labelStyle = {
  display: 'block',
  marginBottom: '5px',
  fontSize: '13px',
  fontWeight: 'bold',
  color: '#666',
}
const inputStyle = {
  width: '100%',
  padding: '10px',
  borderRadius: '6px',
  border: '1px solid #ddd',
  boxSizing: 'border-box',
  outline: 'none',
}
const thStyle = { padding: '15px', fontSize: '14px' }

export default AdminCouponsPage
