import axiosClient from './axiosClient';

const statisticsApi = {
  // Admin - Thống kê toàn sàn
  getAdminDashboard: () => {
    return axiosClient.get('/admin/statistics');
  },

  // Seller - Thống kê riêng
  getSellerDashboard: () => {
    return axiosClient.get('/seller/statistics');
  },
};

export default statisticsApi;
