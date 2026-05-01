import { Link, useLocation } from 'react-router-dom'
import { BarChart, Users, Tag, ShoppingBag, LogOut, LayoutDashboard } from 'lucide-react'

export default function AdminLayout({ children, onLogout, userName }) {
  const location = useLocation()

  const navItems = [
    { path: '/admin/shops', label: 'Duyệt Gian Hàng', icon: <ShoppingBag size={20} />, color: '#3b82f6' },
    { path: '/admin/categories', label: 'Quản Lý Category', icon: <Tag size={20} />, color: '#6366f1' },
    { path: '/admin/membership-tiers', label: 'Quản Lý Hạng', icon: <BarChart size={20} />, color: '#8b5cf6' },
    { path: '/admin/coupons', label: 'Coupon Toàn Sàn', icon: <Tag size={20} />, color: '#ec4899' },
    { path: '/admin/users', label: 'Quản Lý User', icon: <Users size={20} />, color: '#10b981' },
  ]

  const isActive = (path) => location.pathname === path

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9f8fc' }}>
      {/* ===== SIDEBAR ===== */}
      <div
        style={{
          width: '260px',
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          color: 'white',
          padding: '20px 0',
          height: '100vh',
          position: 'sticky',
          top: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* LOGO */}
        <div style={{ padding: '0 20px 30px 20px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <h1 style={{ color: '#f8fafc', margin: 0, fontSize: '24px', fontWeight: 'bold' }}>
            🏢 AdminPanel
          </h1>
          <p style={{ color: '#94a3b8', margin: '5px 0 0 0', fontSize: '12px' }}>
            Hệ thống quản trị Shopii
          </p>
        </div>

        {/* MENU */}
        <nav style={{ flex: 1, padding: '20px 0' }}>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {navItems.map((item) => (
              <li key={item.path} style={{ marginBottom: '4px' }}>
                <Link
                  to={item.path}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 20px',
                    background: isActive(item.path) ? item.color : 'transparent',
                    color: isActive(item.path) ? 'white' : '#cbd5e1',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontWeight: isActive(item.path) ? 'bold' : 'normal',
                    transition: 'all 0.2s',
                    margin: '0 10px',
                  }}
                >
                  {item.icon}
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* LOGOUT */}
        <div style={{ padding: '0 10px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ padding: '15px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ color: '#94a3b8', fontSize: '13px' }}>
              <p style={{ margin: 0, fontWeight: 'bold', color: '#e2e8f0' }}>{userName || 'Admin'}</p>
              <p style={{ margin: '3px 0 0 0', fontSize: '11px' }}>Administrator</p>
            </div>
            <button
              onClick={onLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 12px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#fca5a5',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '13px',
                transition: 'background 0.2s',
              }}
            >
              <LogOut size={16} />
              Đăng xuất
            </button>
          </div>
        </div>
      </div>

      {/* ===== PHẦN NỘI DUNG ===== */}
      <div style={{ flex: 1, minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        {/* HEADER BAR CHO NỘI DUNG */}
        <div
          style={{
            background: 'white',
            padding: '16px 30px',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ margin: 0, color: '#1e293b', fontSize: '20px' }}>
              {navItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
            </h2>
          </div>
          <div style={{ color: '#64748b', fontSize: '13px' }}>
            Trang chủ / {navItems.find((item) => isActive(item.path))?.label || 'Dashboard'}
          </div>
        </div>

        {/* NỘI DUNG CHÍNH */}
        <div style={{ padding: '30px', flex: 1 }}>
          {children}
        </div>

        {/* FOOTER RIÊNG CHO ADMIN */}
        <footer className="admin-footer" style={{
          background: 'white',
          borderTop: '1px solid #e2e8f0',
          padding: '20px 30px',
          textAlign: 'center',
          color: '#64748b',
          fontSize: '13px'
        }}>
          <p style={{ margin: 0 }}>© 2026 Shopii Admin Panel - Hệ thống quản trị</p>
          <p style={{ margin: '5px 0 0 0' }}>Địa chỉ: 180 Cao Lỗ, Phường 4, Quận 8, TP. Hồ Chí Minh</p>
        </footer>
      </div>
    </div>
  )
}
