import React, { useState, useEffect } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'

import userApi from './api/userApi'
import UsersPage from './pages/UsersPage'
import Home from './pages/HomePage'
import Login from './pages/Login'
import Register from './pages/Register'
import CartPage from './pages/CartPage'
import CheckoutPage from './pages/CheckoutPage'
import PaymentResult from './pages/PaymentResult'
import OrderHistoryPageV2 from './pages/OrderHistoryPageV2'
import ProductDetailPage from './pages/ProductDetailPage'
import SellerCouponManagementPage from './pages/SellerCouponManagementPage'
import SellerProductDetail from './pages/SellerProductDetail'
import ResetPassword from './pages/ResetPassword'
import ForgotPassword from './pages/ForgotPassword'
import VerifyOTP from './pages/VerifyOTP'

import SellerRegister from './pages/SellerRegister'
import ProfilePage from './pages/ProfilePage'

import CategoriesPage from './pages/CategoriesPage'
import Reviews from './pages/Review'
import AdminShopsPage from './pages/AdminShopsPage'

import ShopPage from './pages/ShopPage'
import SellerOrderManagementPage from './pages/SellerOrderManagementPage'
import ChatPage from './pages/ChatPage'

import './App.css'

function App() {
  const navigate = useNavigate()
  const [cartCount, setCartCount] = useState(0)
  const [cartItems, setCartItems] = useState([])
  const [user, setUser] = useState(() => {
    const info = localStorage.getItem('USER_INFO')
    return info ? JSON.parse(info) : null
  })
  const loadCart = () => {
    const cart = JSON.parse(localStorage.getItem('CART')) || []
    setCartItems(cart)

    const total = cart.reduce((sum, item) => sum + item.quantity, 0)
    setCartCount(total)
    window.addEventListener('storage', loadCart)
    window.addEventListener('cartUpdated', loadCart)
  }
  useEffect(() => {
    loadCart()

    const handleUserUpdate = () => {
      const info = localStorage.getItem('USER_INFO')
      setUser(info ? JSON.parse(info) : null)
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate)
      window.removeEventListener('storage', loadCart)
      window.removeEventListener('cartUpdated', loadCart)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await userApi.logout()
    } catch (err) {
      console.log('Logout error:', err)
    }
    localStorage.removeItem('ACCESS_TOKEN')
    localStorage.removeItem('USER_INFO')
    setUser(null)
    navigate('/')
  }

  return (
    <div className="app-container">
      <header className="shopee-header">
        <div className="header-content">
          <Link to="/" className="logo">
            Shopii
          </Link>

          <nav className="nav-menu">
            {user && user.role === 'seller' ? (
              <Link to="/" className="nav-link">
                Trang chủ
              </Link>
            ) : (
              <>
                <Link to="/orders" className="nav-link">
                  Đơn mua
                </Link>
                <Link to="/chat" className="nav-link">
                  Chat
                </Link>
                <Link to="/seller" className="nav-link">
                  Kênh người bán
                </Link>
              </>
            )}

            <div className="cart-wrapper">
              {user && user.role === 'user' && (
                <Link to="/cart" className="nav-link cart-icon">
                  <ShoppingCart size={22} />

                  {user && user.cartCount > 0 && (
                    <span className="cart-badge">{user.cartCount}</span>
                  )}
                </Link>
              )}

              <div className="cart-dropdown">
                {cartItems.length === 0 ? (
                  <p className="empty-cart-mini">Chưa có sản phẩm</p>
                ) : (
                  <>
                    {cartItems.slice(0, 5).map((item) => (
                      <div key={item.id} className="mini-item">
                        <img
                          src={
                            item.image ||
                            'https://placehold.co/50x50?text=No+Image'
                          }
                          alt={item.name}
                        />
                        <div>
                          <p>{item.name}</p>
                          <span>{item.price}đ</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* ADMIN */}
            {user && (user.role === 'admin' || user.role === 1) && (
              <Link
                to="/categories"
                className="nav-link"
                style={{ color: '#3b82f6', fontWeight: 'bold' }}
              >
                Categories
              </Link>
            )}

            {/* SELLER */}
            {user && (user.role === 'seller' || user.role === 2) && (
              <>
                <Link
                  to="/seller"
                  className="nav-link"
                  style={{ color: '#ee4d2d', fontWeight: 'bold' }}
                >
                  Cửa hàng của tôi
                </Link>

                <Link
                  to="/seller-coupons"
                  className="nav-link"
                  style={{ color: 'green', fontWeight: 'bold' }}
                >
                  Coupons
                </Link>

                <Link
                  to="/seller-orders"
                  className="nav-link"
                  style={{ color: '#3b82f6', fontWeight: 'bold' }}
                >
                  Quản lý đơn
                </Link>
              </>
            )}

            {!user ? (
              <>
                <Link to="/login" className="nav-link">
                  Đăng nhập
                </Link>
                <Link to="/register" className="nav-link">
                  Đăng ký
                </Link>
              </>
            ) : (
              <>
                <div className="user-menu">
                  <div className="user-trigger">
                    <div className="avatar">
                      {user.name?.charAt(0).toUpperCase()}
                    </div>

                    <span>{user.name}</span>
                  </div>

                  <div className="dropdown-menu">
                    {user.role !== 'seller' && user.role !== 2 && (
                      <>
                        <Link to="/profile" className="dropdown-item">
                          Tài khoản của tôi
                        </Link>
                        <Link to="/orders" className="dropdown-item">
                          Đơn mua
                        </Link>
                      </>
                    )}

                    <div
                      className="dropdown-item logout"
                      onClick={handleLogout}
                    >
                      Đăng xuất
                    </div>
                  </div>
                </div>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/payment-result" element={<PaymentResult />} />
          <Route path="/orders" element={<OrderHistoryPageV2 />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/product/:id" element={<ProductDetailPage />} />
          <Route
            path="/seller-orders"
            element={<SellerOrderManagementPage />}
          />
          <Route path="/chat" element={<ChatPage />} />
          <Route
            path="/seller-coupons"
            element={<SellerCouponManagementPage />}
          />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/verify-otp" element={<VerifyOTP />} />

          <Route path="/seller/register" element={<SellerRegister />} />

          <Route path="/profile" element={<ProfilePage />} />

          <Route path="/categories" element={<CategoriesPage />} />

          <Route path="/reviews" element={<Reviews />} />

          <Route path="/admin/shops" element={<AdminShopsPage />} />

          <Route path="/seller" element={<ShopPage />} />
          <Route
            path="/seller/products/:id"
            element={<SellerProductDetail />}
          />
        </Routes>
      </main>
    </div>
  )
}

export default App
