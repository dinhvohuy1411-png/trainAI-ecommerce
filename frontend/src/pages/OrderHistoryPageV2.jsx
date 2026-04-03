import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import orderProcessingApi from "../api/orderProcessingApi";
import chatApi from "../api/chatApi";
import OrderHistoryTable from "../components/Order/OrderHistoryTable";

export default function OrderHistoryPageV2() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState(null);

  const navigate = useNavigate();

  const fetchOrders = async () => {
    try {
      setErrorMessage(null);
      setLoading(true);
      const res = await orderProcessingApi.getOrderHistories();
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrorMessage(err?.response?.data?.message || "Lỗi tải đơn hàng.");
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleChatWithShop = async (shopId) => {
    try {
      const res = await chatApi.createConversation(shopId);
      const conversationId = res.data?.id;
      if (conversationId) {
        navigate(`/chat?conversationId=${conversationId}`);
      }
    } catch (err) {
      alert(err?.response?.data?.message || "Không thể tạo cuộc trò chuyện.");
    }
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "60vh",
          backgroundColor: "#f5f5f5",
        }}
      >
        <div
          className="spinner"
          style={{
            width: "40px",
            height: "40px",
            border: "4px solid #ddd",
            borderTop: "4px solid #ee4d2d",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        ></div>
      </div>
    );
  }

  return (
    <div>
      {errorMessage && (
        <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 15px", marginTop: 15 }}>
          <div style={{ background: "#fee2e2", color: "#991b1b", padding: 12, borderRadius: 8 }}>
            {errorMessage}
          </div>
        </div>
      )}
      <OrderHistoryTable orders={orders} onChatWithShop={handleChatWithShop} />
    </div>
  );
}

