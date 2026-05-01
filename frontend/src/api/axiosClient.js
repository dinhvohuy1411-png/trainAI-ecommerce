import axios from 'axios'

const axiosClient = axios.create({
  //http://localhost:8000/api/
  //https://trainai-ecommerce.onrender.com/api/
  baseURL: 'https://trainai-ecommerce.onrender.com/api/',

  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
})

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('ACCESS_TOKEN')

  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }

  console.log('REQUEST URL:', config.url)

  return config
})

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error

    if (response && response.status === 401) {
      localStorage.removeItem('ACCESS_TOKEN')
      localStorage.removeItem('USER_INFO')
      window.location.href = '/login'
    }

    throw error
  }
)

export default axiosClient
