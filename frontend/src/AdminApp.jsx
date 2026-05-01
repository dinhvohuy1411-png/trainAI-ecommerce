import React, { useEffect, useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'

import CategoriesPage from './pages/CategoriesPage'
import AdminShopsPage from './pages/AdminShopsPage'
import AdminMembershipTiersPage from './pages/AdminMembershipTiersPage'
import AdminCouponsPage from './pages/AdminCouponsPage'
import UsersPage from './pages/UsersPage'
import AdminLayout from './components/AdminLayout'
import './App.css'

export default function AdminApp() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    const info = localStorage.getItem('USER_INFO')
    return info ? JSON.parse(info) : null
  })

  useEffect(() => {
    const handleUserUpdate = () => {
      const info = localStorage.getItem('USER_INFO')
      const updatedUser = info ? JSON.parse(info) : null
      setUser(updatedUser)
    }
    window.addEventListener('userUpdated', handleUserUpdate)
    return () => window.removeEventListener('userUpdated', handleUserUpdate)
  }, [])

  const handleLogout = async () => {
    localStorage.removeItem('ACCESS_TOKEN')
    localStorage.removeItem('USER_INFO')
    setUser(null)
    navigate('/login')
  }

  return (
    <AdminLayout onLogout={handleLogout} userName={user?.name}>
      <Routes>
        <Route path="categories" element={<CategoriesPage />} />
        <Route path="shops" element={<AdminShopsPage />} />
        <Route path="membership-tiers" element={<AdminMembershipTiersPage />} />
        <Route path="coupons" element={<AdminCouponsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Routes>
    </AdminLayout>
  )
}
