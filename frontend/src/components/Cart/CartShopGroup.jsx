import React from "react";

import QuantitySelector from "../Button/QuantitySelector";

const CartShopGroup = ({
  shopName,
  items,
  selectedItems,
  onCheckShop,
  onCheckItem,
  onUpdateQty,
  onDelete,
}) => {
  // Kiểm tra xem tất cả sản phẩm trong shop này có được chọn chưa
  const allIds = items.map((i) => i.id);
  const isShopSelected = allIds.every((id) => selectedItems.includes(id));

  return (
    <div
      className="cart-shop-group"
      style={{
        backgroundColor: "#fff",
        marginBottom: "15px",
        padding: "15px",
        borderRadius: "4px",
      }}
    >
      {/* Header của Shop */}
      <div
        className="shop-header"
        style={{
          borderBottom: "1px solid #eee",
          paddingBottom: "10px",
          marginBottom: "10px",
          display: "flex",
          gap: "10px",
        }}
      >
        <input
          type="checkbox"
          checked={isShopSelected}
          onChange={onCheckShop}
        />
        <span className="shop-name-label" style={{ fontWeight: "bold" }}>
          Store: {shopName}
        </span>
      </div>

      {/* Danh sách sản phẩm */}
      {items.map((item) => (
        <div
          key={item.id}
          className="cart-item-row"
          style={{
            display: "flex",
            alignItems: "center",
            padding: "10px 0",
            borderBottom: "1px dashed #f5f5f5",
          }}
        >
          {/* Checkbox sản phẩm */}
          <div className="col-checkbox" style={{ marginRight: "10px" }}>
            <input
              type="checkbox"
              checked={selectedItems.includes(item.id)}
              onChange={() => onCheckItem(item.id)}
            />
          </div>

          {/* Ảnh và Tên */}
          <div
            className="col-product"
            style={{ display: "flex", flex: 2, gap: "10px" }}
          >
            <img
              src={item.image || "https://via.placeholder.com/80"}
              alt=""
              style={{ width: "60px", height: "60px", objectFit: "cover" }}
            />
            <div className="item-info">
              <div className="item-name" style={{ fontSize: "14px" }}>
                {item.product_name}
              </div>
              <div
                className="item-sku"
                style={{ fontSize: "12px", color: "#888" }}
              >
                Phân loại: {item.sku_code || "Mặc định"}
              </div>
            </div>
          </div>

          {/* Đơn giá */}
          <div className="col-price" style={{ flex: 1, textAlign: "center" }}>
            ₫{Number(item.price).toLocaleString()}
          </div>

          {/* Số lượng */}
          <div
            className="col-qty"
            style={{ flex: 1, display: "flex", justifyContent: "center" }}
          >
            <QuantitySelector
              value={item.quantity}
              min={1}
              // max={item.stock} // Mở comment nếu có check tồn kho
              onChange={(newVal) => onUpdateQty(item, newVal)}
            />
          </div>

          {/* Thành tiền */}
          <div
            className="col-total"
            style={{
              flex: 1,
              textAlign: "center",
              color: "#ee4d2d",
              fontWeight: "bold",
            }}
          >
            ₫{(item.price * item.quantity).toLocaleString()}
          </div>

          {/* Nút Xóa */}
          <div className="col-action" style={{ flex: 0.5, textAlign: "right" }}>
            <button
              onClick={() => onDelete(item.id)}
              style={{
                border: "none",
                background: "none",
                color: "#333",
                cursor: "pointer",
              }}
            >
              Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default CartShopGroup;
