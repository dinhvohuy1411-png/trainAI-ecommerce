import axiosClient from "./axiosClient";

const productReviewApi = {
  getReviewsByProduct(productId) {
    return axiosClient.get("/product-reviews", {
      params: { product_id: productId },
    });
  },

  createReview(payload) {
    return axiosClient.post("/product-reviews", payload);
  },

  updateReview(reviewId, payload) {
    return axiosClient.put(`/product-reviews/${reviewId}`, payload);
  },

  deleteReview(reviewId) {
    return axiosClient.delete(`/product-reviews/${reviewId}`);
  },
};

export default productReviewApi;

