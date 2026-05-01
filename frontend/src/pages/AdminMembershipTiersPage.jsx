import { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

function AdminMembershipTiersPage() {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(false)

  // State quản lý Form (Dùng chung cho cả Thêm và Sửa)
  const [formData, setFormData] = useState({
    name: '',
    min_spent: '',
    discount_percent: '',
  })
  const [editingId, setEditingId] = useState(null) // Nếu có ID tức là đang Sửa, nếu null là Thêm mới

  useEffect(() => {
    fetchTiers()
  }, [])

  const fetchTiers = () => {
    setLoading(true)
    axiosClient
      .get('/admin/membership-tiers')
      .then((res) => setTiers(res.data))
      .catch((err) => console.error('Lỗi tải dữ liệu', err))
      .finally(() => setLoading(false))
  }

  // --- XỬ LÝ FORM ---
  const handleInputChange = (e) => {
    const { name, value } = e.target
    setFormData({ ...formData, [name]: value })
  }

  const resetForm = () => {
    setFormData({ name: '', min_spent: '', discount_percent: '' })
    setEditingId(null)
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (
      !formData.name ||
      formData.min_spent === '' ||
      formData.discount_percent === ''
    ) {
      return alert('Vui lòng điền đầy đủ thông tin!')
    }

    if (editingId) {
      // Gọi API Cập nhật (Sửa)
      axiosClient
        .put(`/admin/membership-tiers/${editingId}`, formData)
        .then(() => {
          alert('Cập nhật thành công!')
          fetchTiers()
          resetForm()
        })
        .catch((err) => alert('Lỗi: ' + err.response?.data?.message))
    } else {
      // Gọi API Thêm mới
      axiosClient
        .post('/admin/membership-tiers', formData)
        .then(() => {
          alert('Thêm hạng thành công!')
          fetchTiers()
          resetForm()
        })
        .catch((err) => alert('Lỗi: ' + err.response?.data?.message))
    }
  }

  // --- XỬ LÝ NÚT SỬA / XÓA ---
  const handleEditClick = (tier) => {
    setEditingId(tier.id)
    setFormData({
      name: tier.name,
      min_spent: tier.min_spent,
      discount_percent: tier.discount_percent,
    })
    // Cuộn lên đầu trang chỗ có form
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = (id) => {
    if (
      window.confirm(
        'Hành động này không thể hoàn tác. Bạn có chắc muốn xóa hạng này?'
      )
    ) {
      axiosClient
        .delete(`/admin/membership-tiers/${id}`)
        .then(() => {
          alert('Đã xóa hạng!')
          fetchTiers()
          if (editingId === id) resetForm() // Nếu đang sửa mà bấm xóa thì reset form
        })
        .catch((err) => alert('Lỗi khi xóa: ' + err.response?.data?.message))
    }
  }

  // --- GIAO DIỆN (UI) ---
  return (
    <div
      style={{
        padding: '30px',
        maxWidth: '1200px',
        margin: '0 auto',
        fontFamily: 'sans-serif',
      }}
    >
      <h2 style={{ color: '#333', marginBottom: '20px' }}>
        Quản lý Hạng Thành Viên
      </h2>

      {/* KHU VỰC FORM (THÊM / SỬA) */}
      <div
        style={{
          backgroundColor: '#fff',
          padding: '20px',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          marginBottom: '30px',
          borderLeft: editingId ? '5px solid #ffc107' : '5px solid #0d6efd',
        }}
      >
        <h3 style={{ marginTop: 0, color: editingId ? '#d39e00' : '#0d6efd' }}>
          {editingId ? `✎ Đang cập nhật: ${formData.name}` : '+ Thêm Hạng Mới'}
        </h3>

        <form
          onSubmit={handleSubmit}
          style={{
            display: 'flex',
            gap: '15px',
            alignItems: 'flex-end',
            flexWrap: 'wrap',
          }}
        >
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              Tên hạng
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="VD: Hạng Vàng"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>
          <div style={{ flex: 1, minWidth: '200px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              Mốc chi tiêu tối thiểu (VNĐ)
            </label>
            <input
              type="number"
              name="min_spent"
              value={formData.min_spent}
              onChange={handleInputChange}
              placeholder="VD: 5000000"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>
          <div style={{ width: '150px' }}>
            <label
              style={{
                display: 'block',
                marginBottom: '5px',
                fontWeight: 'bold',
                fontSize: '14px',
              }}
            >
              % Giảm giá
            </label>
            <input
              type="number"
              name="discount_percent"
              value={formData.discount_percent}
              onChange={handleInputChange}
              placeholder="VD: 5"
              step="0.1"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: '4px',
                border: '1px solid #ccc',
              }}
            />
          </div>
          <div>
            <button
              type="submit"
              style={{
                padding: '10px 20px',
                backgroundColor: editingId ? '#ffc107' : '#0d6efd',
                color: editingId ? '#000' : '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              {editingId ? 'Lưu Thay Đổi' : 'Tạo Mới'}
            </button>
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                style={{
                  padding: '10px 15px',
                  marginLeft: '10px',
                  backgroundColor: '#6c757d',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Hủy
              </button>
            )}
          </div>
        </form>
      </div>

      {/* KHU VỰC BẢNG DỮ LIỆU */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: '8px',
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          overflow: 'hidden',
        }}
      >
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'left',
          }}
        >
          <thead
            style={{
              backgroundColor: '#f8f9fa',
              borderBottom: '2px solid #dee2e6',
            }}
          >
            <tr>
              <th style={{ padding: '15px', color: '#495057' }}>ID</th>
              <th style={{ padding: '15px', color: '#495057' }}>Tên Hạng</th>
              <th style={{ padding: '15px', color: '#495057' }}>
                Mốc Chi Tiêu
              </th>
              <th style={{ padding: '15px', color: '#495057' }}>
                Ưu Đãi Giảm Giá
              </th>
              <th
                style={{
                  padding: '15px',
                  color: '#495057',
                  textAlign: 'center',
                }}
              >
                Thao Tác
              </th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ padding: '20px', textAlign: 'center' }}
                >
                  Đang tải dữ liệu...
                </td>
              </tr>
            ) : tiers.length === 0 ? (
              <tr>
                <td
                  colSpan="5"
                  style={{ padding: '20px', textAlign: 'center' }}
                >
                  Chưa có cấu hình hạng nào.
                </td>
              </tr>
            ) : (
              tiers.map((tier) => (
                <tr key={tier.id} style={{ borderBottom: '1px solid #e9ecef' }}>
                  <td
                    style={{
                      padding: '15px',
                      fontWeight: 'bold',
                      color: '#6c757d',
                    }}
                  >
                    #{tier.id}
                  </td>
                  <td
                    style={{
                      padding: '15px',
                      fontWeight: 'bold',
                      color: '#0d6efd',
                    }}
                  >
                    {tier.name}
                  </td>
                  <td style={{ padding: '15px' }}>
                    {Number(tier.min_spent).toLocaleString('vi-VN')} đ
                  </td>
                  <td style={{ padding: '15px' }}>
                    <span
                      style={{
                        backgroundColor: '#d1e7dd',
                        color: '#0f5132',
                        padding: '4px 8px',
                        borderRadius: '12px',
                        fontSize: '12px',
                        fontWeight: 'bold',
                      }}
                    >
                      Giảm {tier.discount_percent}%
                    </span>
                  </td>
                  <td style={{ padding: '15px', textAlign: 'center' }}>
                    <button
                      onClick={() => handleEditClick(tier)}
                      style={{
                        padding: '6px 12px',
                        marginRight: '8px',
                        backgroundColor: '#ffc107',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDelete(tier.id)}
                      style={{
                        padding: '6px 12px',
                        backgroundColor: '#dc3545',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '13px',
                      }}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default AdminMembershipTiersPage
