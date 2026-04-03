import axiosClient from "./axiosClient";

const chatApi = {
  createConversation(shopId) {
    return axiosClient.post("/conversations", { shop_id: shopId });
  },

  listConversations() {
    return axiosClient.get("/conversations");
  },

  listMessages(conversationId) {
    return axiosClient.get(`/conversations/${conversationId}/messages`);
  },

  sendMessage(conversationId, content) {
    return axiosClient.post(`/conversations/${conversationId}/messages`, {
      content,
    });
  },
};

export default chatApi;

