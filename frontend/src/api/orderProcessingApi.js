import axiosClient from "./axiosClient";

const orderProcessingApi = {
  // User: orders + histories
  getOrderHistories() {
    return axiosClient.get("/order-histories");
  },

  getOrderHistoryDetail(orderId) {
    return axiosClient.get(`/order-histories/${orderId}`);
  },

  // Seller: manage orders
  getSellerOrders() {
    return axiosClient.get("/seller/orders");
  },

  confirmOrder(orderId) {
    return axiosClient.post(`/seller/orders/${orderId}/confirm`);
  },

  shippingOrder(orderId) {
    return axiosClient.post(`/seller/orders/${orderId}/shipping`);
  },

  completeOrder(orderId) {
    return axiosClient.post(`/seller/orders/${orderId}/complete`);
  },

  cancelOrder(orderId) {
    return axiosClient.post(`/seller/orders/${orderId}/cancel`);
  },
};

export default orderProcessingApi;

