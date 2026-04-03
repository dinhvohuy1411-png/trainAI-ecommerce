import axiosClient from "./axiosClient";

const orderApi = {
  getMyOrders() {
    return axiosClient.get("/orders");
  },

  getOrderDetail(id) {
    return axiosClient.get(`/orders/${id}`);
  },

  cancelOrder(id) {
    return axiosClient.post(`/orders/${id}/cancel`);
  },
};

export default orderApi;
