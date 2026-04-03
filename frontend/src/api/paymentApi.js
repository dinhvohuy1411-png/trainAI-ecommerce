import axiosClient from './axiosClient'

const paymentApi = {
  // 1. Gọi API tạo link thanh toán MoMo
  createMoMoUrl(data) {
    return axiosClient.post('/payment/momo', data)
  },

  // 2. Gọi API tạo link thanh toán VNPay
  createVNPayUrl(data) {
    return axiosClient.post('/payment/vnpay', data)
  },

  // 3. Xử lý Return URL của MoMo 
  momoReturn(query) {
    return axiosClient.get('/payment/momo-callback' + query)
  },
}

export default paymentApi
