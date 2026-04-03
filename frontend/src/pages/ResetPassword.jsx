import { useState } from 'react'
import axiosClient from '../api/axiosClient'
import { useSearchParams } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'
function ResetPassword() {
  const email = localStorage.getItem('reset_email')
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [message, setMessage] = useState('')
  const navigate = useNavigate()
  const handleReset = async (e) => {
    e.preventDefault()

    try {
      const res = await axiosClient.post('/reset-password', {
        email,
        token,
        password,
        password_confirmation: passwordConfirmation,
      })
      alert(res.data.message)
      navigate('/login')
    } catch (error) {
      setMessage('Reset thất bại')
    }
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#f4f6fb',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '360px',
          background: '#fff',
          padding: '35px',
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
            marginBottom: '30px',
          }}
        >
          <div style={{ width: '30px' }}></div>

          <h2
            style={{
              margin: 0,
              fontSize: '20px',
              fontWeight: '600',
              textAlign: 'center',
              flex: 1,
            }}
          >
            Đặt lại mật khẩu
          </h2>

          <div style={{ width: '30px' }}></div>
        </div>

        <form onSubmit={handleReset}>
          {/* Password */}
          <div
            style={{
              position: 'relative',
              marginBottom: '20px',
            }}
          >
            <input
              type="password"
              placeholder=" "
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
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
                background: '#fff',
                padding: '0 5px',
                fontSize: '12px',
                color: '#888',
              }}
            >
              Mật khẩu mới
            </label>
          </div>

          {/* Confirm password */}
          <div
            style={{
              position: 'relative',
              marginBottom: '20px',
            }}
          >
            <input
              type="password"
              placeholder=" "
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
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
                background: '#fff',
                padding: '0 5px',
                fontSize: '12px',
                color: '#888',
              }}
            >
              Xác nhận mật khẩu
            </label>
          </div>

          {/* Error */}
          {message && (
            <div
              style={{
                background: '#ffe6e6',
                color: '#d8000c',
                padding: '10px',
                borderRadius: '6px',
                marginBottom: '15px',
                fontSize: '14px',
              }}
            >
              {message}
            </div>
          )}

          {/* Button */}
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
            Đặt lại mật khẩu
          </button>
        </form>
      </div>
    </div>
  )
}

export default ResetPassword
