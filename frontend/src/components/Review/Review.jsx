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
    const res = await axiosClient.get("/reviews", {
  params: { product_id: productId }
});
    setReviews(res.data);
  };
  const submitReview = async () => {
    if (!rating || !comment) {
      alert("Vui lòng chọn sao và nhập nhận xét");
      return;
    }
    try {
      setLoading(true);

     const data = {
  product_id: productId,
  rating,
  comment,
};

await axiosClient.post("/reviews", data);

if (orderId) {
  data.order_id = orderId;
}

await axiosClient.post("/reviews", data);

      setRating(0);
      setComment("");
      fetchReviews();
  } catch (err) {
  console.log(err.response.data);
  console.log(err.response.data.errors);
  console.log(err.response.data.errors.order_id);
   alert("Lỗi");
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
        <h4>Nhận xét ({reviews.length})</h4>

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
