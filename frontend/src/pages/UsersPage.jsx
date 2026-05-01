import React, { useEffect, useState } from 'react'
import axiosClient from '../api/axiosClient'

function UsersPage() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user', password: '' })
  const [detailModal, setDetailModal] = useState(null) // user detail for pre-delete check

  const loadUsers = async () => {
    setLoading(true)
    try {
      const res = await axiosClient.get('/admin/users')
      setUsers(res.data.data || res.data)
    } catch (err) {
      console.error('Lỗi khi tải users:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  // CREATE / UPDATE
  const handleSubmit = async () => {
    try {
      if (editingUser) {
        await axiosClient.put(`/admin/users/${editingUser.id}`, {
          name: formData.name,
          email: formData.email,
          role: formData.role,
        })
      } else {
        await axiosClient.post('/admin/users', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: formData.role,
        })
      }
      setShowModal(false)
      setEditingUser(null)
      setFormData({ name: '', email: '', role: 'user', password: '' })
      loadUsers()
      alert('Thao tác thành công!')
    } catch (err) {
      console.error('Lỗi:', err)
      alert('Có lỗi xảy ra')
    }
  }

  // Xem chi tiết user trước khi xóa (để kiểm tra seller có đơn hàng/sản phẩm không)
  const handleViewBeforeDelete = async (id) => {
    try {
      const res = await axiosClient.get(`/admin/users/${id}`)
      setDetailModal(res.data)
    } catch (err) {
      console.error('Lỗi:', err)
    }
  }

  // SOFT DELETE - gửi email xác nhận
  const handleSoftDelete = async (id) => {
    try {
      const res = await axiosClient.post(`/admin/users/${id}/soft-delete`)
      alert(res.data.message)
      setDetailModal(null)
      loadUsers()
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Có lỗi xảy ra'
      const errorCode = err.response?.data?.code

      // Hiển thị thông báo lỗi cụ thể theo loại
      if (errorCode === 'HAS_PENDING_ORDERS') {
        const pendingCount = err.response?.data?.pending_orders
        alert(`Không thể xóa! Seller có ${pendingCount} đơn hàng đang xử lý. Vui lòng hoàn tất hoặc hủy đơn trước.`)
      } else if (errorCode === 'HAS_ACTIVE_PRODUCTS') {
        const productCount = err.response?.data?.active_products
        alert(`Không thể xóa! Seller có ${productCount} sản phẩm đang bán. Vui lòng xóa hoặc ẩn sản phẩm trước.`)
      } else {
        alert(errorMsg)
      }
    }
  }

  // Mở modal thêm mới
  const openCreateModal = () => {
    setEditingUser(null)
    setFormData({ name: '', email: '', role: 'user', password: '' })
    setShowModal(true)
  }

  // Mở modal sửa
  const openEditModal = (user) => {
    setEditingUser(user)
    setFormData({ name: user.name, email: user.email, role: user.role, password: '' })
    setShowModal(true)
  }

  // FORMAT ROLE
  const formatRole = (role) => {
    const roleMap = { admin: 'Admin', seller: 'Người Bán', user: 'Khách Hàng', customer: 'Khách Hàng' }
    return roleMap[role] || role
  }

  // GET ROLE COLOR
  const getRoleColor = (role) => {
    const colorMap = { admin: '#ef4444', seller: '#f59e0b', user: '#10b981', customer: '#3b82f6' }
    return colorMap[role] || '#6b7280'
  }

  return (
    <div>
      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>
            Quản lý tài khoản người dùng trên hệ thống
          </p>
        </div>
        <button
          onClick={openCreateModal}
          style={{
            padding: '10px 20px',
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          ➕ Thêm User Mới
        </button>
      </div>

      {/* TABLE */}
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Đang tải...</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <th style={thStyle}>ID</th>
                <th style={thStyle}>Tên</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Vai trò</th>
                <th style={thStyle}>Ngày tạo</th>
                <th style={thStyle}>Trạng thái</th>
                <th style={thStyle}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
                    Không có user nào
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={tdStyle}>#{user.id}</td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: getRoleColor(user.role),
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 'bold',
                          fontSize: '14px'
                        }}>
                          {user.name?.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500' }}>{user.name}</span>
                      </div>
                    </td>
                    <td style={tdStyle}>{user.email}</td>
                    <td style={tdStyle}>
                      <span style={{
                        padding: '4px 10px',
                        borderRadius: '20px',
                        background: getRoleColor(user.role) + '20',
                        color: getRoleColor(user.role),
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {formatRole(user.role)}
                      </span>
                    </td>
                    <td style={tdStyle}>{user.created_at ? new Date(user.created_at).toLocaleDateString('vi-VN') : '-'}</td>
                    <td style={tdStyle}>
                      {user.deleted_at ? (
                        <span style={{ color: '#ef4444', fontWeight: 'bold', fontSize: '12px' }}>
                          ⏳ Chờ xác nhận xóa
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 'bold', fontSize: '12px' }}>
                          ✅ Hoạt động
                        </span>
                      )}
                    </td>
                    <td style={tdStyle}>
                      {!user.deleted_at && (
                        <>
                          <button
                            onClick={() => openEditModal(user)}
                            style={actionBtnStyle('#3b82f6')}
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => handleViewBeforeDelete(user.id)}
                            style={actionBtnStyle('#ef4444')}
                          >
                            Xóa
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL THÊM / SỬA */}
      {showModal && (
        <div style={modalOverlay}>
          <div style={modalContent}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>
              {editingUser ? '✏️ Sửa User' : '➕ Thêm User Mới'}
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '13px' }}>Tên</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                style={inputStyle}
                placeholder="Nhập tên user"
              />
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '13px' }}>Email</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                style={inputStyle}
                placeholder="Nhập email"
              />
            </div>

            {!editingUser && (
              <div style={{ marginBottom: '15px' }}>
                <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '13px' }}>Mật khẩu</label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  style={inputStyle}
                  placeholder="Nhập mật khẩu"
                />
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#475569', fontSize: '13px' }}>Vai trò</label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                style={inputStyle}
              >
                <option value="user">Khách hàng (User)</option>
                <option value="customer">Khách hàng (Customer)</option>
                <option value="seller">Người bán (Seller)</option>
                <option value="admin">Quản trị (Admin)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => { setShowModal(false); setEditingUser(null); }}
                style={{
                  padding: '10px 20px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={handleSubmit}
                style={{
                  padding: '10px 20px',
                  background: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                {editingUser ? 'Cập Nhật' : 'Thêm Mới'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHI TIẾT TRƯỚC KHI XÓA */}
      {detailModal && (
        <div style={modalOverlay}>
          <div style={{ ...modalContent, width: '500px' }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1e293b' }}>
              ⚠️ Xác nhận xóa User
            </h3>

            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
              <p style={{ margin: '0 0 10px 0', fontWeight: 'bold', fontSize: '16px' }}>
                {detailModal.name} (#{detailModal.id})
              </p>
              <p style={{ margin: '0 0 5px 0', color: '#64748b', fontSize: '14px' }}>
                Email: {detailModal.email}
              </p>
              <p style={{ margin: '0', color: '#64748b', fontSize: '14px' }}>
                Vai trò: <span style={{ color: getRoleColor(detailModal.role), fontWeight: 'bold' }}>{formatRole(detailModal.role)}</span>
              </p>
            </div>

            {/* Hiển thị cảnh báo nếu là seller */}
            {detailModal.role === 'seller' && detailModal.seller_info && (
              <div style={{ background: '#fef3c7', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #f59e0b' }}>
                <p style={{ margin: '0 0 10px 0', color: '#92400e', fontWeight: 'bold' }}>
                  ⚠️ Cảnh báo cho Người Bán
                </p>
                {detailModal.seller_info.pending_orders > 0 && (
                  <p style={{ margin: '0 0 5px 0', color: '#92400e', fontSize: '14px' }}>
                    📦 Có <strong>{detailModal.seller_info.pending_orders}</strong> đơn hàng đang xử lý
                  </p>
                )}
                {detailModal.seller_info.active_products > 0 && (
                  <p style={{ margin: '0 0 5px 0', color: '#92400e', fontSize: '14px' }}>
                    🛒 Có <strong>{detailModal.seller_info.active_products}</strong> sản phẩm đang bán
                  </p>
                )}
                {(detailModal.seller_info.pending_orders > 0 || detailModal.seller_info.active_products > 0) && (
                  <p style={{ margin: '10px 0 0 0', color: '#dc2626', fontSize: '13px', fontWeight: 'bold' }}>
                    Không thể xóa Seller khi còn đơn hàng hoặc sản phẩm đang hoạt động.
                  </p>
                )}
              </div>
            )}

            <div style={{ background: '#fee2e2', padding: '15px', borderRadius: '8px', marginBottom: '20px', border: '1px solid #ef4444' }}>
              <p style={{ margin: 0, color: '#991b1b', fontSize: '14px' }}>
                <strong>⚠️ Lưu ý:</strong> Sau khi xóa, email xác nhận sẽ được gửi đến <strong>{detailModal.email}</strong>.
                Tài khoản sẽ bị xóa vĩnh viễn khi user click xác nhận trong email (trong vòng 7 ngày).
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setDetailModal(null)}
                style={{
                  padding: '10px 20px',
                  background: '#e2e8f0',
                  color: '#475569',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                onClick={() => handleSoftDelete(detailModal.id)}
                style={{
                  padding: '10px 20px',
                  background: '#ef4444',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                🗑️ Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const thStyle = { padding: '14px 16px', textAlign: 'left', color: '#64748b', fontWeight: '600', fontSize: '13px' }
const tdStyle = { padding: '14px 16px', fontSize: '14px' }
const inputStyle = { width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px', boxSizing: 'border-box' }

const actionBtnStyle = (color) => ({
  marginRight: '8px',
  padding: '6px 12px',
  background: color + '15',
  color: color,
  border: 'none',
  borderRadius: '6px',
  cursor: 'pointer',
  fontSize: '13px',
  fontWeight: '500'
})

const modalOverlay = {
  position: 'fixed',
  top: 0, left: 0, right: 0, bottom: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000
}

const modalContent = {
  background: 'white',
  borderRadius: '12px',
  padding: '30px',
  width: '450px',
  maxWidth: '90vw'
}

export default UsersPage
