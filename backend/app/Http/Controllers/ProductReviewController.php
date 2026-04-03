<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ProductReviewController extends Controller
{
    public function index(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
        ]);

        $reviews = ProductReview::with(['user'])
            ->where('product_id', $request->query('product_id'))
            ->latest()
            ->get();

        return response()->json($reviews);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_id' => 'required|exists:products,id',
            'order_id' => 'required|exists:orders,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string|max:1000',
        ]);

        $user = $request->user();
        $productId = (int) $request->product_id;
        $orderId = (int) $request->order_id;

        $order = Order::with(['items.sku.product'])
            ->where('id', $orderId)
            ->where('user_id', $user->id)
            ->first();

        if (!$order) {
            return response()->json(['message' => 'Đơn hàng không hợp lệ.'], 403);
        }

        if ($order->status !== 'completed') {
            return response()->json(['message' => 'Chỉ được đánh giá khi đơn đã hoàn thành.'], 422);
        }

        $hasProduct = $order->items->some(function ($item) use ($productId) {
            return (int) optional($item->sku?->product)->id === $productId;
        });

        if (!$hasProduct) {
            return response()->json(['message' => 'Sản phẩm không thuộc đơn hàng này.'], 422);
        }

        $alreadyReviewed = ProductReview::where('user_id', $user->id)
            ->where('product_id', $productId)
            ->exists();

        if ($alreadyReviewed) {
            return response()->json(['message' => 'Bạn đã đánh giá sản phẩm này.'], 409);
        }

        DB::beginTransaction();
        try {
            $review = ProductReview::create([
                'user_id' => $user->id,
                'product_id' => $productId,
                'order_id' => $orderId,
                'rating' => (int) $request->rating,
                'comment' => $request->comment,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Đánh giá thành công.',
                'review' => $review,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi tạo đánh giá.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, $reviewId)
    {
        $request->validate([
            'rating' => 'sometimes|integer|min:1|max:5',
            'comment' => 'sometimes|nullable|string|max:1000',
        ]);

        $review = ProductReview::where('id', $reviewId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $review->update($request->only(['rating', 'comment']));

        return response()->json($review);
    }

    public function destroy(Request $request, $reviewId)
    {
        $review = ProductReview::where('id', $reviewId)
            ->where('user_id', $request->user()->id)
            ->firstOrFail();

        $review->delete();

        return response()->json(['message' => 'Đã xóa đánh giá.']);
    }
}

