import axiosClient from './axiosClient'

const productApi = {
  getProducts() {
    return axiosClient.get('/products')
  },

  getProduct(id) {
    return axiosClient.get(`/products/${id}`)
  },

  createProduct(data) {
    return axiosClient.post('/products', data)
  },

  updateProduct(id, data) {
    return axiosClient.put(`/products/${id}`, data)
  },

  deleteProduct(id) {
    return axiosClient.delete(`/products/${id}`)
  },
  getCate() {
    return axiosClient.get('/categories')
  },
}

export default productApi
