import { useState } from 'react'
import axiosClient from '../api/axiosClient'
import { Link, useNavigate } from 'react-router-dom'
export default function Forgot() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const handleForgot = async (e) => {
    e.preventDefault()
    setError(null)
    try {
      const response = await axiosClient.post('/forgot-password', {
        email: email,
      })
      localStorage.setItem('reset_email', email)
      alert(response.data.message)
      navigate('/verify-otp')
    } catch (err) {
      console.error(err)
      setError(
        err.response?.data?.message || 'Yêu cầu đặt lại mật khẩu thất bại!'
      )
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
        width: '100%',
      }}
    >
      <div
        style={{
          width: '320px',
          background: '#ffffff',
          padding: '30px 40px 40px 40px',
          borderRadius: '12px',
          boxShadow: '0 8px 25px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '25px',
          }}
        >
          <Link
            to="/login"
            style={{
              textDecoration: 'none',
              color: '#5a5df0',
              fontSize: '22px',
              fontWeight: '500',
              width: '30px',
            }}
          >
            ←
          </Link>

          <h2
            style={{
              margin: 0,
              flex: 1,
              textAlign: 'center',
              fontSize: '20px',
              fontWeight: '600',
            }}
          >
            Quên mật khẩu
          </h2>

          <div style={{ width: '30px' }}></div>
        </div>

        {/* Form */}
        <form onSubmit={handleForgot}>
          <div
            style={{
              position: 'relative',
              marginBottom: '20px',
              width: '100%',
            }}
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder=" "
              autoComplete="email"
              style={{
                width: '100%',
                padding: '14px',
                border: '1px solid #ddd',
                borderRadius: '6px',
                fontSize: '14px',
                boxSizing: 'border-box',
              }}
            />

            <label
              style={{
                position: 'absolute',
                top: '-8px',
                left: '10px',
                background: '#ffffff',
                padding: '0 5px',
                fontSize: '12px',
                color: '#888',
              }}
            >
              Email
            </label>
          </div>

          {error && (
            <div
              style={{
                background: '#ffe6e6',
                color: '#d8000c',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px',
                whiteSpace: 'pre-line',
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '14px',
              background: '#5a5df0',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              fontSize: '16px',
              cursor: 'pointer',
            }}
          >
            Gửi yêu cầu
          </button>
        </form>
      </div>
    </div>
  )
}
