import { Navigate, Outlet } from 'react-router-dom'

const ProtectedRoute = ({ allowedRoles }) => {
  const token = localStorage.getItem('ACCESS_TOKEN')
  const userInfoStr = localStorage.getItem('USER_INFO')

  // 1. Nếu chưa đăng nhập (Không có token hoặc không có info)
  if (!token || !userInfoStr) {
    // Dùng Navigate thay vì window.location để chuyển trang mượt mà không reload
    return <Navigate to="/login" replace />
  }

  const user = JSON.parse(userInfoStr)

  // 2. Nếu route này yêu cầu quyền cụ thể (VD: Chỉ seller mới được vào)
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Không đủ quyền -> Đá về trang chủ
    return <Navigate to="/" replace />
  }

  // 3. Nếu mọi thứ hợp lệ -> Hiển thị Component con (Outlet)
  return <Outlet />
}

export default ProtectedRoute
