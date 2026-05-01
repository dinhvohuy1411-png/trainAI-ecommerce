import { useEffect, useState } from "react";
import axiosClient from "../api/axiosClient";
export default function ReviewSection({ productId, orderId, token }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);

  // Load review
  useEffect(() => {
    fetchReviews();
  }, [productId]);

 const fetchReviews = async () => {
  try {
    // Đổi axios thành axiosClient và sửa lại route (bỏ /api/ đi nếu axiosClient đã có sẵn)
    const res = await axiosClient.get("reviews", {
      params: { product_id: productId }
    });

    console.log("API RESPONSE:", res.data);

    if (Array.isArray(res.data)) {
      setReviews(res.data);
    } else if (Array.isArray(res.data.data)) {
      setReviews(res.data.data);
    } else {
      setReviews([]);
    }

  } catch (error) {
    console.error("Lỗi khi tải đánh giá:", error);
    setReviews([]);
  }
  };
  const submitReview = async () => {
  if (!orderId) {
    alert("Bạn chưa mua sản phẩm này");
    return;
  }

  if (!rating || !comment) {
    alert("Vui lòng chọn sao và nhập nhận xét");
    return;
  }

  try {
    setLoading(true);

    await axiosClient.post(
  "/reviews", 
  {
    product_id: productId,
    order_id: orderId,
    rating,
    comment,
  },
  {
    headers: {
      Authorization: `Bearer ${token}` // Thay đổi format nếu backend yêu cầu khác
    }
  }
);

    fetchReviews();
    setComment("");
    setRating(0);

  } catch (err) {
  console.error(err);
  alert("Lỗi khi gửi đánh giá: " + (err.response?.data?.message || err.message));
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="review-box">
      <h3>Đánh giá sản phẩm</h3>

      {/* Rating */}
      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "star active" : "star"}
            onClick={() => setRating(star)}
          >
            ★
          </span>
        ))}
      </div>

      {/* Comment */}
      <textarea
        placeholder="Nhập nhận xét của bạn..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />

      <button onClick={submitReview} disabled={loading}>
        {loading ? "Đang gửi..." : "Gửi đánh giá"}
      </button>

      {/* Review List */}
      <div className="review-list">
        <h4>Các Lượt Đánh Giá ({Array.isArray(reviews) ? reviews.length : 0})</h4>
        {reviews.map((r) => (
          <div className="review-item" key={r.id}>
            <div className="review-header">
              <strong>{r.user?.name || "Ẩn danh"}</strong>
              <div className="stars small">
                {[1, 2, 3, 4, 5].map((s) => (
                  <span
                    key={s}
                    className={s <= r.rating ? "star active" : "star"}
                  >
                    ★
                  </span>
                ))}
              </div>
            </div>
            <p>{r.comment}</p>
            <small>{new Date(r.created_at).toLocaleDateString()}</small>
          </div>
        ))}
      </div>
    </div>
  );
}
