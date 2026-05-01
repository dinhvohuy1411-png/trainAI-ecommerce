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

use App\Models\Shop;

use App\Models\UserMembership;
use App\Models\MembershipTier;

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


        // 1. Validate dữ liệu

    // 3. API Xử lý đặt hàng (Checkout)
    public function checkout(Request $request)
    {
        $request->validate([
            'cart_item_ids' => 'required|array',
            'address_id' => 'required|exists:user_addresses,id',
            'shipping_method_id' => 'required|exists:shipping_methods,id',
            'payment_method_id' => 'required|exists:payment_methods,id',
            'coupon_code' => 'nullable|string|exists:coupons,code',
        ]);

        DB::beginTransaction();
        try {
            /** @var \App\Models\User $user */
            $user = Auth::user();

            // --- LOGIC HẠNG THÀNH VIÊN: Lấy % giảm giá của User hiện tại ---
            $tierDiscountPercent = $user->getDiscountRate();

            // 2. Lấy sản phẩm từ giỏ hàng dựa trên IDs gửi lên
            $items = CartItem::with('sku.product')
                ->whereIn('id', $request->cart_item_ids)
                ->whereHas('cart', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                })
                ->get();

            if ($items->isEmpty()) {
                return response()->json(['message' => 'Vui lòng chọn sản phẩm hợp lệ'], 400);
            }

            // --- LOGIC KIỂM TRA COUPON ---
            $coupon = null;
            if ($request->has('coupon_code')) {
                // Lấy coupon kèm theo thông tin Hạng yêu cầu (eager load 'tier')
                $coupon = Coupon::with('tier')->where('code', $request->coupon_code)
                    ->where('start_date', '<=', Carbon::now())
                    ->where('end_date', '>=', Carbon::now())
                    ->where('usage_limit', '>', 0)
                    ->lockForUpdate() // Khóa bản ghi để tránh bị tranh chấp số lượt dùng
                    ->first();

                if (!$coupon) {
                    return response()->json(['message' => 'Mã giảm giá không hợp lệ hoặc đã hết hạn'], 400);
                }

                // KIỂM TRA ĐIỀU KIỆN HẠNG THÀNH VIÊN ĐỂ DÙNG COUPON
                if ($coupon->membership_tier_id) {
                    $userTier = $user->currentTier();
                    $requiredTier = $coupon->tier;

                    // Nếu user không có hạng hoặc mốc chi tiêu thấp hơn hạng yêu cầu của mã
                    if (!$userTier || (float)$userTier->min_spent < (float)$requiredTier->min_spent) {
                        return response()->json([
                            'message' => 'Mã giảm giá này chỉ dành cho thành viên hạng ' . $requiredTier->name . ' trở lên.'
                        ], 400);
                    }
                }
            }

            // 3. Gom nhóm sản phẩm theo Shop để tạo nhiều đơn hàng
            $itemsByShop = $items->groupBy(function ($item) {
                return $item->sku->product->shop_id;
            });

            // Tính tổng tiền sản phẩm của từng shop để tính coupon/tier sau này
            $shopTotals = $itemsByShop->map(function ($shopItems) {
                return $shopItems->sum(function ($item) {
                    return $item->sku->price * $item->quantity;
                });
            });

            $createdOrderIds = [];
            $grandTotal = 0;

            // Thiết lập các biến hỗ trợ tính toán Coupon
            $couponDiscountAmount = 0;
            $couponTargetShopId = null;
            $couponWillBeApplied = false;
            $couponRemainingDiscountAmount = 0;

            if ($coupon) {
                $cartProductTotal = (float) $shopTotals->sum();

                // Trường hợp 1: Coupon Toàn Sàn (shop_id IS NULL)
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
                        }
                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponRemainingDiscountAmount = (float) $couponDiscountAmount;
                    }
                } else {
                    // Trường hợp 2: Coupon riêng của một Shop
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
                        }
                        $couponWillBeApplied = $couponDiscountAmount > 0;
                        $couponTargetShopId = $targetShopId;
                    }
                }
            }

            // 4. Lặp qua từng shop để tạo Order
            foreach ($itemsByShop as $shopId => $shopItems) {
                $shopTotal = 0;

                // Tính tiền hàng và kiểm tra tồn kho của SKU
                foreach ($shopItems as $item) {
                    $shopTotal += $item->sku->price * $item->quantity;
                    if ($item->sku->stock < $item->quantity) {
                        throw new \Exception("Sản phẩm " . $item->sku->product->name . " không đủ hàng.");
                    }
                }

                // Tính toán tiền giảm từ Coupon cho đơn hàng này
                $couponDiscountForThisShop = 0;
                if ($couponWillBeApplied) {
                    if ($coupon->shop_id === null) {
                        // Nếu là mã toàn sàn, phân bổ tiền giảm vào đơn theo số tiền còn lại
                        if ($couponRemainingDiscountAmount > 0) {
                            $couponDiscountForThisShop = min((float) $couponRemainingDiscountAmount, (float) $shopTotal);
                            $couponRemainingDiscountAmount -= $couponDiscountForThisShop;
                        }
                    } elseif ($couponTargetShopId !== null && (int) $shopId === (int) $couponTargetShopId) {
                        // Nếu là mã của shop, áp dụng toàn bộ cho shop đó
                        $couponDiscountForThisShop = (float) $couponDiscountAmount;
                    }
                }

                // --- LOGIC HẠNG THÀNH VIÊN: Tính tiền giảm giá theo đặc quyền của hạng ---
                $tierDiscountAmount = 0;
                if ($tierDiscountPercent > 0) {
                    $tierDiscountAmount = ($shopTotal * $tierDiscountPercent) / 100;
                }

                // Tổng tiền được giảm (Cộng dồn Coupon và Tier)
                $totalDiscount = $couponDiscountForThisShop + $tierDiscountAmount;

                // Lấy phí vận chuyển (Mặc định 30k nếu không tìm thấy phương thức)
                $shippingMethod = ShippingMethod::find($request->shipping_method_id);
                $shippingFee = $shippingMethod ? $shippingMethod->base_fee : 30000;

                $finalTotal = $shopTotal + $shippingFee - $totalDiscount;
                if ($finalTotal < 0) $finalTotal = 0;

                $grandTotal += $finalTotal;


                // KIỂM TRA SHOP CÓ BẬT AUTO DUYỆT KHÔNG BẰNG CACHE

                // Kiểm tra cấu hình Auto Duyệt đơn của Shop từ Cache

                $isAutoConfirm = Cache::get('shop_auto_confirm_' . $shopId, false);
                $initialStatus = $isAutoConfirm ? 'confirmed' : 'pending';

                // Tạo đơn hàng chính
                $order = Order::create([
                    'user_id' => $user->id,
                    'shop_id' => $shopId,
                    'total_product_price' => $shopTotal,
                    'shipping_fee' => $shippingFee,
                    'discount_amount' => $totalDiscount,
                    'final_total' => $finalTotal,
                    'user_address_id' => $request->address_id,
                    'payment_method_id' => $request->payment_method_id,

                    'shipping_method_id' => $request->shipping_method_id ?? 1, 
                    'status' => $initialStatus,
                    'payment_status' => 'unpaid' 


                ]);

                $createdOrderIds[] = $order->id;

                // Lưu lịch sử đơn hàng nếu được duyệt tự động
                if ($isAutoConfirm) {
                    \App\Models\OrderHistory::create([
                        'order_id' => $order->id,
                        'status' => 'confirmed',
                        'note' => 'Hệ thống tự động duyệt đơn'
                    ]);
                }

                // 5. Lưu chi tiết đơn hàng và cập nhật kho
                foreach ($shopItems as $item) {
                    OrderItem::create([
                        'order_id' => $order->id,
                        'product_sku_id' => $item->product_sku_id,
                        'quantity' => $item->quantity,
                        'price' => $item->sku->price
                    ]);

                    // Trừ kho và xóa khỏi giỏ hàng
                    $item->sku->decrement('stock', $item->quantity);
                    $item->delete();
                }
            }

            // --- TRỪ LƯỢT DÙNG COUPON NẾU CÓ ÁP DỤNG ---
            if ($couponWillBeApplied && $coupon) {
                $coupon->decrement('usage_limit');
            }

            DB::commit();

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

    // Lấy danh sách đơn hàng của khách hàng
    public function index(Request $request)
    {
        $user = Auth::user();
        $orders = Order::with(['items.sku.product', 'userAddress', 'paymentMethod'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->get();
        return response()->json($orders);
    }

    // Xem chi tiết một đơn hàng
    public function show($id)
    {
        $user = Auth::user();
        $order = Order::with(['shop', 'items.sku.product', 'userAddress'])
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->firstOrFail();
        return response()->json($order);
    }


    // 1. Lấy danh sách đơn hàng mà Shop nhận được

    // Lấy danh sách đơn hàng dành cho Seller
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

    // 2. Chủ shop cập nhật trạng thái đơn hàng

    // Seller cập nhật trạng thái đơn hàng

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

        // --- LOGIC HẠNG THÀNH VIÊN: Xét thăng hạng nếu đơn hàng hoàn thành ---
        if ($order->status === 'completed') {
            $this->updateUserMembership($order->user_id, $order->final_total);
        }

        return response()->json(['message' => 'Cập nhật trạng thái đơn hàng thành công', 'order' => $order]);
    }


    // Lấy trạng thái Auto Confirm hiện tại của Shop

    // Lấy cài đặt Auto Duyệt đơn của Shop

    public function getAutoConfirmSetting()
    {
        $shop = \App\Models\Shop::where('user_id', Auth::id())->first();
        if (!$shop) return response()->json(['auto_confirm' => false]);

        $isAuto = Cache::get('shop_auto_confirm_' . $shop->id, false);
        return response()->json(['auto_confirm' => $isAuto]);
    }

    // Bật/Tắt Auto Duyệt đơn
    public function toggleAutoConfirm(Request $request)
    {
        $shop = \App\Models\Shop::where('user_id', Auth::id())->first();
        if (!$shop) return response()->json(['message' => 'Lỗi'], 403);

        $isAuto = $request->auto_confirm; 
        Cache::forever('shop_auto_confirm_' . $shop->id, $isAuto);

        return response()->json([
            'message' => 'Cập nhật cấu hình thành công!',
            'auto_confirm' => $isAuto
        ]);
    }

        
    // Khách hàng xác nhận đã nhận hàng
    public function confirmReceipt($id)
    {
        $user = Auth::user();

        $order = Order::where('id', $id)
                      ->where('user_id', $user->id)
                      ->where('status', 'shipping')
                      ->first();
                      
        if (!$order) {
            return response()->json(['message' => 'Không thể cập nhật đơn hàng này'], 400);
        }

        $order->status = 'completed';
        $order->payment_status = 'paid';
        $order->save();

        \App\Models\OrderHistory::create([
            'order_id' => $order->id,
            'status' => 'completed',
            'note' => 'Khách hàng đã xác nhận nhận hàng'
        ]);

        // --- LOGIC HẠNG THÀNH VIÊN: Thăng hạng khi khách hoàn thành đơn hàng ---
        $this->updateUserMembership($order->user_id, $order->final_total);

        return response()->json(['message' => 'Cảm ơn bạn đã mua sắm!']);
    }

    /**
     * HÀM PRIVATE XỬ LÝ LOGIC CỘNG TIỀN VÀ XÉT THĂNG HẠNG
     */
    private function updateUserMembership($userId, $orderTotal)
    {
        // 1. Tìm hoặc tạo mới bản ghi membership cho user
        $membership = UserMembership::firstOrCreate(
            ['user_id' => $userId],
            ['total_spent' => 0, 'tier_id' => null]
        );

        // 2. Cộng tiền đơn hàng vừa hoàn thành vào tổng chi tiêu
        $membership->total_spent += $orderTotal;

        // 3. Tìm hạng cao nhất mà user đạt được dựa trên tổng chi tiêu
        $newTier = MembershipTier::where('is_active', true)
            ->where('min_spent', '<=', $membership->total_spent)
            ->orderBy('min_spent', 'desc')
            ->first();

        // 4. Nếu đạt mốc hạng mới, cập nhật vào DB
        if ($newTier) {
            $membership->tier_id = $newTier->id;
        }

        $membership->save();
    }
}