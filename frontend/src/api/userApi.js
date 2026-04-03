import axiosClient from './axiosClient'

const userApi = {
  login(data) {
    return axiosClient.post('/login', data)
  },

  register(data) {
    return axiosClient.post('/register', data)
  },

  getProfile() {
    return axiosClient.get('/user')
  },

  logout() {
    return axiosClient.post('/logout')
  },
  forgotPassword(email) {
    return axiosClient.post('/forgot-password', { email })
  },
  ResetPassword(data) {
    return axiosClient.post('/reset-password', data)
  },
  verifyOTP(data) {
    return axiosClient.post('/verify-otp', data)
  },
}

export default userApi
