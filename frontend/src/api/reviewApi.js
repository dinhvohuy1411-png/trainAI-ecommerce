import axiosClient from "./axiosClient";
const reviewApi = {
    getReview() {
        return axiosClient.get("/review");
    }
};
export default reviewApi;
