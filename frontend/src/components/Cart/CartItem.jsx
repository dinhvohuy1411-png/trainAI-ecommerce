import React from "react";

const CartItem = ({ item, isSelected, onCheck, onUpdateQty, onDelete }) => {
  return (
    <div className="cart-item-row">
      {/* Checkbox & Ảnh & Tên */}
      <div className="col-product flex-start">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onCheck(item.id)}
          className="item-checkbox"
        />
        <img
          src={item.image || "https://placehold.co/80"}
          alt={item.product_name}
          className="item-img"
        />
        <div className="item-info">
          <p className="item-name">{item.product_name}</p>
          <span className="item-sku">Phân loại: {item.sku_code}</span>
        </div>
      </div>

      {/* Giá */}
      <div className="col-price">₫{Number(item.price).toLocaleString()}</div>

      {/* Số lượng */}
      <div className="col-qty">
        <div className="qty-control">
          <button onClick={() => onUpdateQty(item, item.quantity - 1)}>
            -
          </button>
          <input type="text" value={item.quantity} readOnly />
          <button onClick={() => onUpdateQty(item, item.quantity + 1)}>
            +
          </button>
        </div>
      </div>

      {/* Tổng tiền */}
      <div className="col-total text-orange">
        ₫{(Number(item.price) * item.quantity).toLocaleString()}
      </div>

      {/* Xóa */}
      <div className="col-action">
        <button className="btn-delete" onClick={() => onDelete(item.id)}>
          Xóa
        </button>
      </div>
    </div>
  );
};

export default CartItem;
