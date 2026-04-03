<?php
namespace App\Http\Controllers;
use App\Models\Review;
use Illuminate\Http\Request;
use App\Models\Order;
class ReviewController extends Controller
{
    public function index(Request $request)
    {
         $request->validate([
            'product_id' => 'required|exists:products,id'
        ]);
        return Review::with('user')
            ->where('product_id', $request->product_id)
            ->latest()
            ->get();
            
    }
    public function store(Request $request)
    {
        $request->validate([
        'rating' => 'required|integer|min:1|max:5',
        'comment' => 'nullable|string',
        'product_id' => 'required|exists:products,id',
        'order_id' => 'sometimes|nullable|exists:orders,id',
    ]);
    $order = Order::find($request->order_id);
    if ($request->order_id && (!$order || $order->user_id !== auth()->id())) {
        return response()->json(['message' => 'Invalid order.'], 400);
    }

    $review = Review::create([
        'user_id' => auth()->id(),
        'product_id' => $request->product_id,
        'order_id' => $request->order_id,
        'rating' => $request->rating,
        'comment' => $request->comment,
    ]);

    return response()->json([
        'message' => 'Đánh Giá Thành Công.',
        'review' => $review
    ], 201);
    }
    public function show($id)
    {
         return Review::with(['user', 'product', 'order'])
            ->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $review = Review::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $request->validate([
            'rating'  => 'sometimes|integer|min:1|max:5',
            'comment' => 'sometimes|string|max:1000',
        ]);

        $review->update($request->only('rating', 'comment'));

        return response()->json($review);
    }

    public function destroy($id)
    {
        $review = Review::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $review->delete();

        return response()->json([
            'message' => 'Đã xóa review'
        ]);
    }
}
?>