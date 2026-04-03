import React from "react";

const CartFooter = ({
  totalItems,
  totalPrice,
  onBuy,
  isAllSelected,
  onCheckAll,
}) => {
  return (
    <div className="sticky-footer">
      <div className="footer-content">
        <div className="footer-left">
          <input
            type="checkbox"
            checked={isAllSelected}
            onChange={onCheckAll}
          />
          <span>Chọn tất cả ({totalItems} sản phẩm được chọn)</span>
        </div>

        <div className="footer-right">
          <div className="total-info">
            <span>Tổng thanh toán:</span>
            <span className="total-price">₫{totalPrice.toLocaleString()}</span>
          </div>
          <button
            className="btn-buy"
            onClick={onBuy}
            disabled={totalItems === 0}
          >
            Mua Hàng
          </button>
        </div>
      </div>
    </div>
  );
};

export default CartFooter;
