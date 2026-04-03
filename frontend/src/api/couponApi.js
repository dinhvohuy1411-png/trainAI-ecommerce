import axiosClient from './axiosClient'

const couponApi = {
  getCoupons(shopId) {
    const params = shopId ? { shop_id: shopId } : undefined
    return axiosClient.get('/coupons', { params })
  },
  createCoupon(data) {
    return axiosClient.post('/coupons', data)
  },
  deleteCoupon(id) {
    return axiosClient.delete(`/coupons/${id}`)
  },

  applyCoupon(data) {
    return axiosClient.post('/coupons/apply', data)
  },
}

export default couponApi
