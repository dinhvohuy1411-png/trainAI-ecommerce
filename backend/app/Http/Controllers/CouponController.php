<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Coupon;
use Carbon\Carbon;

class CouponController extends Controller
{
    // 1. Lấy danh sách Coupon (Seller lấy mã của shop, User lấy mã sàn)
    public function index(Request $request)
    {
        $query = Coupon::query();

        if ($request->has('shop_id')) {
            // Seller xem danh sách mã của chính họ
            $query->where('shop_id', $request->shop_id);
        } else {
            // User xem mã đang còn hạn và còn lượt dùng trên toàn sàn
            $now = Carbon::now();
            $query->where('start_date', '<=', $now)
                  ->where('end_date', '>=', $now)
                  ->where('usage_limit', '>', 0)
                  ->whereNull('shop_id');
        }

        return response()->json($query->orderBy('created_at', 'desc')->get());
    }

    // 2. Seller tạo Coupon mới với đầy đủ thông tin
    public function store(Request $request)
    {
    
        $validated = $request->validate([
            'code'               => 'required|string|unique:coupons,code',
            'discount_type'      => 'required|in:fixed,percent', 
            'discount_value'     => 'required|numeric|min:0',
            'min_order_value'    => 'nullable|numeric|min:0',
            'max_discount_value' => 'nullable|numeric|min:0',
            'usage_limit'        => 'required|integer|min:1',
            'start_date'         => 'required|date',
            'end_date'           => 'required|date|after:start_date',
            'shop_id'            => 'required|integer'
        ]);

        try {
            $coupon = Coupon::create($validated);
            return response()->json([
                'message' => 'Tạo coupon thành công!',
                'data' => $coupon
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi DB: ' . $e->getMessage()
            ], 500);
        }
    }

    // 3. Xóa Coupon (Dành cho Seller)
    public function destroy($id)
    {
        $coupon = Coupon::find($id);
        
        if (!$coupon) {
            return response()->json(['message' => 'Không tìm thấy mã này'], 404);
        }

        $coupon->delete();
        return response()->json(['message' => 'Đã xóa mã giảm giá thành công']);
    }

    // 4. Logic áp dụng Coupon 
    public function apply(Request $request)
    {
        $request->validate([
            'coupon_code' => 'required|string',
            'order_total' => 'required|numeric|min:0',
            'shop_id'     => 'nullable|integer',
        ]);

        $now = Carbon::now();
        $coupon = Coupon::where('code', $request->coupon_code)
            ->where('start_date', '<=', $now)
            ->where('end_date', '>=', $now)
            ->where('usage_limit', '>', 0)
            ->first();

        if (!$coupon) {
            return response()->json(['message' => 'Mã không tồn tại hoặc hết hạn'], 400);
        }

        // Kiểm tra đơn hàng tối thiểu
        if ($request->order_total < $coupon->min_order_value) {
            return response()->json(['message' => 'Chưa đủ giá trị đơn hàng tối thiểu'], 400);
        }

        // Tính toán số tiền giảm
        $discount = 0;
        if ($coupon->discount_type === 'fixed') {
            $discount = $coupon->discount_value;
        } else {
            $discount = ($request->order_total * $coupon->discount_value) / 100;
            // Áp dụng mức giảm tối đa nếu có (max_discount_value)
            if ($coupon->max_discount_value && $discount > $coupon->max_discount_value) {
                $discount = $coupon->max_discount_value;
            }
        }

        return response()->json([
            'message' => 'Áp dụng thành công',
            'discount_amount' => min($discount, $request->order_total),
            'coupon_id' => $coupon->id
        ]);
    }
}