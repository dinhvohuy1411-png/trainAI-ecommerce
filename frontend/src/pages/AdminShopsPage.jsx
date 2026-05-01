import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axiosClient from "../api/axiosClient";

// Component con cho Sidebar để code gọn hơn
const SidebarLink = ({ to, label, icon, bgColor, hoverColor }) => {
  const [isHover, setIsHover] = useState(false);
  return (
    <li style={{ marginBottom: "10px" }}>
      <Link
        to={to}
        onMouseEnter={() => setIsHover(true)}
        onMouseLeave={() => setIsHover(false)}
        style={{
          display: "block",
          padding: "12px 15px",
          background: isHover ? hoverColor : bgColor,
          color: "white",
          borderRadius: "8px",
          textDecoration: "none",
          fontWeight: "bold",
          textAlign: "center",
          transition: "all 0.3s ease",
        }}
      >
        {icon} {label}
      </Link>
    </li>
  );
};

function AdminShopsPage() {
  const [shops, setShops] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const fetchShops = () => {
    setLoading(true);
    axiosClient
      .get("/admin/shops")
      .then((res) => {
        setShops(res.data || []);
        setMessage("");
      })
      .catch((err) => {
        console.error(err);
        showTemporaryMessage("❌ Lỗi khi tải danh sách shop");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchShops();
  }, []);

  // Hàm hiển thị thông báo rồi tự ẩn
  const showTemporaryMessage = (msg) => {
    setMessage(msg);
    setTimeout(() => setMessage(""), 4000);
  };

  // Logic xử lý Duyệt/Từ chối chung
  const handleShopAction = (id, action) => {
    const actionText = action === "approve" ? "duyệt" : "từ chối";
    if (!window.confirm(`Bạn có chắc muốn ${actionText} shop này?`)) return;

    axiosClient
      .put(`/admin/shops/${id}/${action}`)
      .then(() => {
        showTemporaryMessage(`✅ ${actionText === "approve" ? "Duyệt" : "Từ chối"} shop thành công!`);
        fetchShops(); // Tải lại danh sách
      })
      .catch((err) => {
        const errorMsg = err.response?.data?.message || err.message;
        showTemporaryMessage(`❌ Lỗi khi ${actionText} shop: ${errorMsg}`);
      });
  };

  return (
    <div className="page" style={{ minHeight: "100vh", background: "#f9f8fc" }}>
      <div style={{ display: "flex" }}>
        
        {/* ===== SIDEBAR MENU ===== */}
        

        {/* ===== MAIN CONTENT ===== */}
        <div style={{ flex: 1, padding: "40px" }}>
          <h2 style={{ fontSize: "28px", color: "#1f2937", marginTop: 0 }}>🏪 Duyệt Gian Hàng</h2>

          {message && (
            <div style={{
              padding: "15px",
              marginBottom: "20px",
              borderRadius: "8px",
              background: message.includes("✅") ? "#d1fae5" : "#fee2e2",
              color: message.includes("✅") ? "#065f46" : "#991b1b",
              border: `1px solid ${message.includes("✅") ? "#a7f3d0" : "#fecaca"}`,
            }}>
              {message}
            </div>
          )}

          {loading ? (
            <p style={{ textAlign: "center", color: "#6b7280" }}>Đang tải...</p>
          ) : shops.length === 0 ? (
            <p style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>✅ Không có shop chờ duyệt</p>
          ) : (
            shops.map((shop) => (
              <ShopCard key={shop.id} shop={shop} onAction={handleShopAction} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}

// Tách riêng Card của từng Shop
const ShopCard = ({ shop, onAction }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        background: "white",
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        marginBottom: "20px",
        boxShadow: isHovered ? "0 10px 25px rgba(0,0,0,0.1)" : "0 1px 3px rgba(0,0,0,0.05)",
        transition: "all 0.3s ease",
      }}
    >
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", marginBottom: "20px" }}>
        <div>
          <h3 style={{ margin: "0 0 10px 0", color: "#1f2937" }}>{shop.name}</h3>
          <p style={{ fontSize: "14px", color: "#6b7280" }}>
            <strong>Chủ sở hữu ID:</strong> {shop.user_id || "N/A"}
          </p>
        </div>
        <div>
          <strong style={{ fontSize: "14px", color: "#374151" }}>📝 Mô tả:</strong>
          <p style={{
            margin: "5px 0 0 0",
            padding: "10px",
            background: "#f9fafb",
            borderRadius: "8px",
            fontSize: "13px",
            color: "#4b5563"
          }}>
            {shop.description || "Chưa có mô tả"}
          </p>
        </div>
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        paddingTop: "15px",
        borderTop: "1px solid #f3f4f6"
      }}>
        <div style={{ fontSize: "13px", color: "#9ca3af" }}>
          📅 Ngày đăng ký: {shop.created_at ? new Date(shop.created_at).toLocaleDateString("vi-VN") : "N/A"}
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={() => onAction(shop.id, "reject")}
            style={{
              padding: "8px 16px",
              background: "#fee2e2",
              color: "#dc2626",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            ❌ Từ chối
          </button>
          <button
            onClick={() => onAction(shop.id, "approve")}
            style={{
              padding: "8px 16px",
              background: "#10b981",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600"
            }}
          >
            ✅ Duyệt Shop
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminShopsPage;