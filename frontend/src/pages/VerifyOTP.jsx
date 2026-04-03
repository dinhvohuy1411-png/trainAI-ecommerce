import { useState, useEffect } from 'react'
import OTPInput from '../components/OTP/OTPInput'
import axiosClient from '../api/axiosClient'
import { useNavigate } from 'react-router-dom'
export default function VerifyOTP() {
  const [time, setTime] = useState(60)
  const navigate = useNavigate()

  useEffect(() => {
    const timer = setInterval(() => {
      setTime((prev) => {
        if (prev === 0) {
          clearInterval(timer)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])
  const handleComplete = async (otp) => {
    try {
      const res = await axiosClient.post('/verify-otp', {
        email: localStorage.getItem('reset_email'),
        otp: otp,
      })
      navigate(`/reset-password?token=${res.data.token}`)
    } catch (err) {
      alert('OTP sai')
    }
  }
  const handleResend = async () => {
    try {
      await axiosClient.post('/forgot-password', {
        email: localStorage.getItem('reset_email'),
      })
      alert('Mã OTP đã được gửi lại')
      setTime(60)
    } catch (err) {
      alert('Gửi lại OTP thất bại')
    }
  }

  return (
    <div style={{ textAlign: 'center', marginTop: '100px' }}>
      <h2>Nhập mã OTP</h2>

      <OTPInput length={6} onComplete={handleComplete} />

      <p style={{ marginTop: '20px', color: '#888' }}>
        Mã OTP đã gửi tới email của bạn
      </p>

      <p
        onClick={time === 0 ? handleResend : null}
        style={{
          cursor: time === 0 ? 'pointer' : 'not-allowed',
          color: time === 0 ? '#5a5df0' : '#888',
        }}
      >
        {time > 0 ? `Gửi lại mã OTP sau ${time}s` : 'Gửi lại mã OTP'}
      </p>
    </div>
  )
}
