<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use App\Models\CartItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Coupon;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use App\Models\ShippingMethod;
use App\Models\PaymentMethod;

class OrderController extends Controller
{
    // 1. API lấy danh sách Đơn vị vận chuyển
    public function getShippingMethods()
    {
        $methods = ShippingMethod::all();
        return response()->json($methods);
    }

    // 2. API lấy danh sách Phương thức thanh toán
    public function getPaymentMethods()
    {
        // Chỉ lấy các phương thức đang được active
        $methods = PaymentMethod::where('is_active', 1)->get();
        return response()->json($methods);
    }
    public function checkout(Request $request) {
        // 1. Validate dữ liệu
        $request->validate([
            'cart_item_ids' => 'required|array',
            'address_id' => 'required|exists:user_addresses,id',
            'shipping_method_id' => 'required|exists:shipping_methods,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'coupon_code' => 'nullable|string|exists:coupons,code',
        ]);

        DB::beginTransaction();
        try {
            $user = Auth::user();
            
            // 2. Lấy sản phẩm từ giỏ
            $items = CartItem::with('sku.product')
                        ->whereIn('id', $request->cart_item_ids)
                        ->whereHas('cart', function($q) use ($user) {
                            $q->where('user_id', $user->id);
                        })
                        ->get();

            if ($items->isEmpty()) {
                return response()->json(['message' => 'Vui lòng chọn sản phẩm hợp lệ'], 400);
            }

            // --- LOGIC COUPON ---
            $coupon = null;
            if ($request->has('coupon_code')) {
                $coupon = Coupon::where('code', $request->coupon_code)
                    ->where('start_date', '<=', Carbon::now())
                    ->where('end_date', '>=', Carbon::now())
                    ->where('usage_limit', '>', 0)
                    ->lockForUpdate()
                    ->first();
                
                if (!$coupon) {
                    return response()->json([
                     'message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'
                    ], 400);
                }
            }

            // 3. Gom nhóm theo Shop
            $itemsByShop = $items->groupBy(function($item) {
                return $item->sku->product->shop_id;
            });

            // Pre-compute shop totals for coupon validation/discount base.
            $shopTotals = $itemsByShop->map(function ($shopItems) {
                return $shopItems->sum(function ($item) {
                    return $item->sku->price * $item->quantity;
                });
            });

            $createdOrderIds = [];
            $grandTotal = 0;

            // Coupon logic
            $couponDiscountAmount = 0;
            $couponTargetShopId = null;
            $couponWillBeApplied = false;
            $couponRemainingDiscountAmount = 0;

            if ($coupon) {
                $cartProductTotal = (float) $shopTotals->sum();
                if ($coupon->shop_id === null) {
                    $couponBaseTotal = $cartProductTotal;
                    if ($couponBaseTotal >= (float) $coupon->min_order_value) {
                        if ($coupon->discount_type === 'fixed') {
                            $couponDiscountAmount = min((float) $coupon->discount_value, $couponBaseTotal);
                        } else {
                            $couponDiscountAmount = ($couponBaseTotal * (float) $coupon->discount_value) / 100;
                            if ($coupon->max_discount_value && $couponDiscountAmount > (float) $coupon->max_discount_value) {
                                $couponDiscountAmount = (float) $coupon->max_discount_value;
                            }
                            if ($couponDiscountAmount > $couponBaseTotal) {
                                $couponDiscountAmount = $couponBaseTotal;
                            }
                        }

                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponRemainingDiscountAmount = (float) $couponDiscountAmount;
                    }
                } else {
                    $targetShopId = (int) $coupon->shop_id;
                    $couponBaseTotal = (float) ($shopTotals->get($targetShopId) ?? 0);
                    if ($couponBaseTotal >= (float) $coupon->min_order_value && $shopTotals->has($targetShopId)) {
                        if ($coupon->discount_type === 'fixed') {
                            $couponDiscountAmount = min((float) $coupon->discount_value, $couponBaseTotal);
                        } else {
                            $couponDiscountAmount = ($couponBaseTotal * (float) $coupon->discount_value) / 100;
                            if ($coupon->max_discount_value && $couponDiscountAmount > (float) $coupon->max_discount_value) {
                                $couponDiscountAmount = (float) $coupon->max_discount_value;
                            }
                            if ($couponDiscountAmount > $couponBaseTotal) {
                                $couponDiscountAmount = $couponBaseTotal;
                            }
                        }

                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponTargetShopId = $targetShopId;
                        $couponRemainingDiscountAmount = 0;
                    }
                }
            }

            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopTotal = 0;
                
                // Tính tiền hàng và check tồn kho
                foreach ($shopItems as $item) {
                    $shopTotal += $item->sku->price * $item->quantity;
                    
                    if ($item->sku->stock < $item->quantity) {
                         throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                $discountAmount = 0;
                if ($couponWillBeApplied) {
                    if ($coupon->shop_id === null) {
                        if ($couponRemainingDiscountAmount > 0) {
                            $discountAmount = min((float) $couponRemainingDiscountAmount, (float) $shopTotal);
                            $couponRemainingDiscountAmount -= $discountAmount;
                        }
                    } elseif ($couponTargetShopId !== null && (int) $shopId === (int) $couponTargetShopId) {
                        $discountAmount = (float) $couponDiscountAmount;
                    }
                }

                $shippingMethod = ShippingMethod::find($request->shipping_method_id);
                $shippingFee = $shippingMethod ? $shippingMethod->base_fee : 30000; 
                
                $finalTotal = $shopTotal + $shippingFee - $discountAmount;
                if ($finalTotal < 0) $finalTotal = 0;

                $grandTotal += $finalTotal;

                // ========================================================
                // KIỂM TRA SHOP CÓ BẬT AUTO DUYỆT KHÔNG BẰNG CACHE
                // ========================================================
                $isAutoConfirm = Cache::get('shop_auto_confirm_' . $shopId, false);
                $initialStatus = $isAutoConfirm ? 'confirmed' : 'pending';

                // 4. Tạo Order
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'total_product_price' => $shopTotal,
                    'shipping_fee' => $shippingFee,
                    'discount_amount' => $discountAmount,
                    'final_total' => $finalTotal,
                    'user_address_id' => $request->address_id,
                    'payment_method_id' => $request->payment_method_id,
                    'shipping_method_id' => $request->shipping_method_id ?? 1, 
                    'status' => $initialStatus, // <--- Gán trạng thái đã check
                    'payment_status' => 'unpaid' 
                ]);

                $createdOrderIds[] = $order->id;

                // LƯU LỊCH SỬ NẾU AUTO CONFIRM
                if ($isAutoConfirm) {
                    \App\Models\OrderHistory::create([
                        'order_id' => $order->id,
                        'status' => 'confirmed',
                        'note' => 'Hệ thống tự động duyệt đơn'
                    ]);
                }
                // ========================================================

                // 5. Lưu Order Items và Trừ kho
                foreach ($shopItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_sku_id' => $item->product_sku_id,
                        'quantity' => $item->quantity,
                        'price' => $item->sku->price
                    ]);
                    
                    $item->sku->decrement('stock', $item->quantity);
                    $item->delete(); 
                }
            }
            
            // --- TRỪ LƯỢT DÙNG COUPON ---
            if ($couponWillBeApplied && $coupon) {
                $coupon->decrement('usage_limit');
            }
            // -----------------------------

            DB::commit();

            // 6. Trả về cho Frontend
            return response()->json([
                'message' => 'Tạo đơn hàng thành công!',
                'order_ids' => $createdOrderIds, 
                'total_amount' => $grandTotal, 
                'payment_method_id' => $request->payment_method_id
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    public function index(Request $request)
    {
        $user = Auth::user();

        $orders = Order::with(['items.sku.product', 'userAddress', 'paymentMethod'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }
    
    public function show($id)
    {
        $user = Auth::user();
        $order = Order::with(['shop', 'items.sku.product', 'userAddress'])
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();

        return response()->json($order);
    }

    // =========================================================
    // KHU VỰC API DÀNH CHO SELLER (QUẢN LÝ ĐƠN HÀNG CỦA SHOP)
    // =========================================================

    // 1. Lấy danh sách đơn hàng mà Shop nhận được
    public function getSellerOrders(Request $request)
    {
        $user = Auth::user();
        
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có cửa hàng'], 403);
        }

        $orders = Order::with(['items.sku.product', 'userAddress'])
            ->leftJoin('users', 'orders.user_id', '=', 'users.id')
            ->where('orders.shop_id', $shop->id)
            ->orderBy('orders.created_at', 'desc')
            ->select('orders.*', 'users.name as user_name')
            ->get();

        return response()->json($orders);
    }

    // 2. Chủ shop cập nhật trạng thái đơn hàng (Duyệt, Hủy, Giao hàng...)
    public function updateOrderStatus(Request $request, $id)
    {
        $request->validate([
            'status' => 'required|in:pending,confirmed,shipping,completed,cancelled'
        ]);

        $user = Auth::user();
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có cửa hàng'], 403);
        }

        $order = Order::where('id', $id)->where('shop_id', $shop->id)->first();
        
        if (!$order) {
            return response()->json(['message' => 'Không tìm thấy đơn hàng'], 404);
        }

        $order->status = $request->status;
        $order->save();

        \App\Models\OrderHistory::create([
            'order_id' => $order->id,
            'status' => $request->status,
            'note' => 'Shop cập nhật trạng thái'
        ]);

        return response()->json(['message' => 'Cập nhật trạng thái đơn hàng thành công', 'order' => $order]);
    }

    // =========================================================
    // KHU VỰC CẤU HÌNH AUTO CONFIRM (DÙNG CACHE)
    // =========================================================

    // Lấy trạng thái Auto Confirm hiện tại của Shop
    public function getAutoConfirmSetting()
    {
        $shop = \App\Models\Shop::where('user_id', Auth::id())->first();
        if (!$shop) return response()->json(['auto_confirm' => false]);

        $isAuto = Cache::get('shop_auto_confirm_' . $shop->id, false);
        return response()->json(['auto_confirm' => $isAuto]);
    }

    // Shop Bật/Tắt Auto Confirm
    public function toggleAutoConfirm(Request $request)
    {
        $shop = \App\Models\Shop::where('user_id', Auth::id())->first();
        if (!$shop) return response()->json(['message' => 'Lỗi'], 403);

        $isAuto = $request->auto_confirm; // true hoặc false
        
        // Dùng Cache::forever để lưu cấu hình này vô thời hạn
        Cache::forever('shop_auto_confirm_' . $shop->id, $isAuto);

        return response()->json([
            'message' => 'Cập nhật cấu hình thành công!',
            'auto_confirm' => $isAuto
        ]);
    }
    public function confirmReceipt($id)
    {
        $user = Auth::user();
        
        // Tìm đơn hàng của user này đang ở trạng thái đang giao
        $order = Order::where('id', $id)
                      ->where('user_id', $user->id)
                      ->where('status', 'shipping')
                      ->first();
                      
        if (!$order) {
            return response()->json(['message' => 'Không thể cập nhật đơn hàng này'], 400);
        }

        // Chuyển sang hoàn thành và đánh dấu đã trả tiền (dù là COD hay MoMo)
        $order->status = 'completed';
        $order->payment_status = 'paid';
        $order->save();

        // Ghi lại lịch sử
        \App\Models\OrderHistory::create([
            'order_id' => $order->id,
            'status' => 'completed',
            'note' => 'Khách hàng đã xác nhận nhận hàng'
        ]);

        return response()->json(['message' => 'Cảm ơn bạn đã mua sắm!']);
    }
}