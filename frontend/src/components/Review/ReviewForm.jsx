import React, { useEffect, useMemo, useState } from "react";
import productReviewApi from "../../api/productReviewApi";

function getCurrentUser() {
  try {
    const raw = localStorage.getItem("USER_INFO");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export default function ReviewForm({ productId, orderId, canReview }) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");

  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const currentUser = useMemo(() => getCurrentUser(), []);
  const currentUserId = currentUser?.id;

  const myReview = useMemo(() => {
    if (!currentUserId) return null;
    return reviews.find((r) => r.user?.id === currentUserId) || null;
  }, [reviews, currentUserId]);

  const alreadyReviewed = !!myReview;

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        const res = await productReviewApi.getReviewsByProduct(productId);
        // Backend returns array of reviews
        setReviews(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };

    if (productId) fetchReviews();
  }, [productId]);

  const submitReview = async () => {
    setErrorMessage(null);

    if (!canReview) {
      setErrorMessage("Bạn chỉ có thể đánh giá khi đơn đã hoàn thành.");
      return;
    }

    if (!orderId) {
      setErrorMessage("Không tìm thấy đơn hoàn thành cho sản phẩm này.");
      return;
    }

    if (alreadyReviewed) {
      setErrorMessage("Bạn đã đánh giá sản phẩm này rồi.");
      return;
    }

    if (!rating || !comment.trim()) {
      setErrorMessage("Vui lòng chọn sao và nhập nhận xét.");
      return;
    }

    try {
      setSubmitting(true);
      await productReviewApi.createReview({
        product_id: productId,
        order_id: orderId,
        rating,
        comment,
      });

      setRating(0);
      setComment("");

      // Refresh list
      const res = await productReviewApi.getReviewsByProduct(productId);
      setReviews(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setErrorMessage(
        err?.response?.data?.message || "Lỗi khi gửi đánh giá. Vui lòng thử lại."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-box">
      <h3>Đánh giá sản phẩm</h3>

      <div className="stars">
        {[1, 2, 3, 4, 5].map((star) => (
          <span
            key={star}
            className={star <= rating ? "star active" : "star"}
            onClick={() => setRating(star)}
            style={{ cursor: "pointer" }}
          >
            ★
          </span>
        ))}
      </div>

      <textarea
        placeholder="Nhập nhận xét của bạn..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={!canReview || submitting}
      />

      <button
        onClick={submitReview}
        disabled={!canReview || submitting || alreadyReviewed}
      >
        {submitting ? "Đang gửi..." : alreadyReviewed ? "Đã đánh giá" : "Gửi đánh giá"}
      </button>

      {errorMessage && (
        <div style={{ color: "#b91c1c", marginTop: 10, fontSize: 14 }}>{errorMessage}</div>
      )}

      <div className="review-list" style={{ marginTop: 16 }}>
        <h4>Các Lượt Đánh Giá ({loading ? 0 : reviews.length})</h4>

        {loading ? (
          <div style={{ color: "#64748b", fontSize: 14 }}>Đang tải...</div>
        ) : (
          reviews.map((r) => (
            <div className="review-item" key={r.id}>
              <div className="review-header">
                <strong>{r.user?.name || "Ẩn danh"}</strong>
                <div className="stars small">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <span key={s} className={s <= r.rating ? "star active" : "star"}>
                      ★
                    </span>
                  ))}
                </div>
              </div>
              <p>{r.comment}</p>
              <small>{r.created_at ? new Date(r.created_at).toLocaleDateString() : ""}</small>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

