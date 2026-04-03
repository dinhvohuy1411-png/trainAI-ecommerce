import { useState } from 'react'
import userApi from '../api/userApi'
import { Link, useNavigate } from 'react-router-dom'

export default function Login() {
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError(null)

    try {
      const response = await userApi.login({
        identifier: identifier,
        password: password,
      })

      localStorage.setItem('ACCESS_TOKEN', response.data.token)
      localStorage.setItem('USER_INFO', JSON.stringify(response.data.user))

      window.dispatchEvent(new Event('userUpdated'))
      alert(response.data.message || 'Đăng nhập thành công!')
      const userRole = response.data.user.role

      if (userRole === 'seller' || userRole === 2) {
        navigate('/seller')
      } else if (userRole === 'admin' || userRole === 1) {
        navigate('/categories')
      } else {
        navigate('/')
      }
    } catch (err) {
      console.error(err)
      setError(err.response?.data?.message || 'Đăng nhập thất bại!')
    }
  }

  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#f4f6fb',
      }}
    >
      <div
        style={{
          width: '420px',
          background: '#ffffff',
          padding: '40px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            color: '#5a5df0',
            marginBottom: '10px',
            fontWeight: '600',
          }}
        >
          Đăng nhập
        </h2>
        {error && (
          <p
            style={{
              background: '#ffe6e6',
              color: '#d8000c',
              padding: '10px',
              borderRadius: '6px',
              marginBottom: '15px',
              fontSize: '14px',
            }}
          >
            {error}
          </p>
        )}

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '22px', position: 'relative' }}>
            <input
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              required
              placeholder=" "
              autoComplete="username"
              style={{
                width: '100%',
                padding: '14px 10px',
                borderRadius: '8px',
                border: '1.5px solid #ccc',
                outline: 'none',
                fontSize: '14px',
              }}
              onFocus={(e) => (e.target.style.border = '1.5px solid #5a5df0')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #ccc')}
            />
            <label
              style={{
                position: 'absolute',
                left: '10px',
                top: identifier ? '-8px' : '50%',
                transform: identifier ? 'translateY(0)' : 'translateY(-50%)',
                background: '#fff',
                padding: '0 6px',
                fontSize: identifier ? '12px' : '14px',
                color: identifier ? '#5a5df0' : '#999',
                transition: '0.2s',
                pointerEvents: 'none',
              }}
            >
              Email / Số điện thoại
            </label>
          </div>

          <div style={{ marginBottom: '22px', position: 'relative' }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder=" "
              style={{
                width: '100%',
                padding: '14px 10px',
                borderRadius: '8px',
                border: '1.5px solid #ccc',
                outline: 'none',
                fontSize: '14px',
              }}
              onFocus={(e) => (e.target.style.border = '1.5px solid #5a5df0')}
              onBlur={(e) => (e.target.style.border = '1.5px solid #ccc')}
            />
            <label
              style={{
                position: 'absolute',
                left: '10px',
                top: password ? '-8px' : '50%',
                transform: password ? 'translateY(0)' : 'translateY(-50%)',
                background: '#fff',
                padding: '0 6px',
                fontSize: password ? '12px' : '14px',
                color: password ? '#5a5df0' : '#999',
                transition: '0.2s',
                pointerEvents: 'none',
              }}
            >
              Mật khẩu
            </label>
          </div>
          <div
            style={{
              marginBottom: '22px',
              position: 'relative',
              textAlign: 'right',
            }}
          >
            <Link
              to="/forgot-password"
              style={{ color: '#5a5df0', fontSize: '14px' }}
            >
              Quên mật khẩu?
            </Link>
          </div>
          <button
            type="submit"
            style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#5a5df0',
              color: '#fff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: '0.3s',
            }}
          >
            Đăng nhập
          </button>
        </form>

        <p style={{ marginTop: '20px', fontSize: '14px', color: '#666' }}>
          Lần đầu bạn đến với Shopii?{' '}
          <Link
            to="/register"
            style={{
              color: '#5a5df0',
              cursor: 'pointer',
              fontWeight: '500',
            }}
          >
            Đăng ký ngay
          </Link>
        </p>
      </div>
    </div>
  )
}
