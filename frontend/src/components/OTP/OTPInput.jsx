import React, { useRef, useState } from 'react'

export default function OTPInput({ length = 6, onComplete }) {
  const [otp, setOtp] = useState(new Array(length).fill(''))
  const inputs = useRef([])

  const handleChange = (element, index) => {
    const value = element.value.replace(/[^0-9]/g, '')

    if (!value) return

    const newOtp = [...otp]
    newOtp[index] = value
    setOtp(newOtp)

    if (index < length - 1) {
      inputs.current[index + 1].focus()
    }

    if (newOtp.join('').length === length) {
      onComplete(newOtp.join(''))
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp]

      if (otp[index]) {
        newOtp[index] = ''
        setOtp(newOtp)
      } else if (index > 0) {
        inputs.current[index - 1].focus()
      }
    }
  }

  const handlePaste = (e) => {
    const pasteData = e.clipboardData.getData('text').slice(0, length)
    if (!/^\d+$/.test(pasteData)) return

    const newOtp = pasteData.split('')
    setOtp(newOtp)

    newOtp.forEach((num, i) => {
      if (inputs.current[i]) inputs.current[i].value = num
    })

    onComplete(pasteData)
  }

  return (
    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
      {otp.map((data, index) => (
        <input
          key={index}
          type="text"
          maxLength="1"
          value={data}
          ref={(el) => (inputs.current[index] = el)}
          onChange={(e) => handleChange(e.target, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          style={{
            width: '45px',
            height: '50px',
            textAlign: 'center',
            fontSize: '20px',
            borderRadius: '8px',
            border: '1px solid #ccc',
            outline: 'none',
          }}
          onFocus={(e) => (e.target.style.border = '1px solid #ee4d2d')}
          onBlur={(e) => (e.target.style.border = '1px solid #ccc')}
        />
      ))}
    </div>
  )
}
