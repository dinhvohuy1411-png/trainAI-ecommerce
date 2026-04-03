import React from "react";

function translateStatus(status) {
  switch (status) {
    case "pending":
      return "Chờ Xác Nhận";
    case "confirmed":
      return "Đã Xác Nhận";
    case "shipping":
      return "Đang Giao";
    case "completed":
      return "Hoàn Thành";
    case "cancelled":
      return "Đã Hủy";
    default:
      return status || "";
  }
}

function getStatusColor(status) {
  if (status === "completed") return "#26aa99";
  if (status === "cancelled") return "#888";
  if (status === "confirmed") return "#3b82f6";
  return "#ee4d2d";
}

export default function SellerOrderManagement({
  orders,
  loadingByOrderId,
  onConfirm,
  onShipping,
  onComplete,
  onCancel,
}) {
  const orderList = Array.isArray(orders) ? orders : [];

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 15px" }}>
      <div
        style={{
          backgroundColor: "white",
          padding: "15px 20px",
          borderRadius: "2px",
          marginBottom: "15px",
          boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
        }}
      >
        <h2 style={{ margin: 0, color: "#333", fontSize: 18, textTransform: "uppercase" }}>
          Quản lý đơn hàng Shop
        </h2>
      </div>

      {orderList.length === 0 ? (
        <div style={{ textAlign: "center", color: "#666", background: "white", padding: 40, borderRadius: 8 }}>
          Chưa có đơn hàng.
        </div>
      ) : (
        orderList.map((order) => (
          <div
            key={order.id}
            style={{
              backgroundColor: "white",
              marginBottom: 15,
              borderRadius: 2,
              boxShadow: "0 1px 1px rgba(0,0,0,0.05)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "15px 20px",
                borderBottom: "1px solid #eaeaea",
              }}
            >
              <div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>
                  Đơn #{order.id}
                </div>
                <div style={{ fontSize: 13, color: "#64748b" }}>
                  Khách: User #{order.user_id}
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span
                  style={{
                    color: getStatusColor(order.status),
                    textTransform: "uppercase",
                    fontSize: 13,
                    fontWeight: 800,
                  }}
                >
                  {translateStatus(order.status)}
                </span>
                <span style={{ color: "#ddd" }}>|</span>
                <span style={{ color: "#26aa99", fontSize: 13, textTransform: "uppercase" }}>
                  {order.payment_status === "paid" ? "Đã Thanh Toán" : "Chưa Thanh Toán"}
                </span>
              </div>
            </div>

            <div>
              <div style={{ padding: "10px 20px", display: "grid", rowGap: 10 }}>
                {(order.items || []).map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      gap: 12,
                      border: "1px solid #f1f5f9",
                      padding: 10,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 700, marginBottom: 2 }}>
                        {item.sku?.product?.name || "Sản phẩm"}
                      </div>
                      <div style={{ fontSize: 13, color: "#64748b" }}>
                        Phân loại: {item.sku?.sku || "Mặc định"} - SL: {item.quantity}
                      </div>
                    </div>
                    <div style={{ fontWeight: 800, color: "#ee4d2d" }}>
                      ₫{Number(item.price || 0).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ padding: 20, background: "#fffefb" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <div style={{ fontSize: 14, color: "#333" }}>Thành tiền</div>
                <div style={{ fontSize: 20, fontWeight: 900, color: "#ee4d2d" }}>
                  ₫{Number(order.final_total || 0).toLocaleString()}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "flex-end" }}>
                {order.status === "pending" && (
                  <button
                    disabled={!!loadingByOrderId?.[order.id]}
                    onClick={() => onConfirm?.(order.id)}
                    style={sellerBtnStyle()}
                  >
                    {loadingByOrderId?.[order.id] ? "Đang xử lý..." : "Xác nhận"}
                  </button>
                )}

                {order.status === "confirmed" && (
                  <button
                    disabled={!!loadingByOrderId?.[order.id]}
                    onClick={() => onShipping?.(order.id)}
                    style={sellerBtnStyle()}
                  >
                    {loadingByOrderId?.[order.id] ? "Đang xử lý..." : "Giao hàng"}
                  </button>
                )}

                {order.status === "shipping" && (
                  <button
                    disabled={!!loadingByOrderId?.[order.id]}
                    onClick={() => onComplete?.(order.id)}
                    style={sellerBtnStyle("#26aa99")}
                  >
                    {loadingByOrderId?.[order.id] ? "Đang xử lý..." : "Hoàn thành"}
                  </button>
                )}

                {["pending", "confirmed", "shipping"].includes(order.status) && (
                  <button
                    disabled={!!loadingByOrderId?.[order.id]}
                    onClick={() => onCancel?.(order.id)}
                    style={sellerBtnStyle("#888")}
                  >
                    {loadingByOrderId?.[order.id] ? "Đang xử lý..." : "Hủy đơn"}
                  </button>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function sellerBtnStyle(color) {
  return {
    minWidth: 150,
    padding: "10px 0",
    border: "1px solid #ddd",
    background: "white",
    color: color || "#555",
    borderRadius: 2,
    cursor: "pointer",
    fontWeight: 700,
  };
}

