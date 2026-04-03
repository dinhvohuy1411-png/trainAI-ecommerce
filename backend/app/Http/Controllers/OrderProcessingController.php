<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderHistory;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class OrderProcessingController extends Controller
{
    private function getSellerShop(Request $request): ?Shop
    {
        $user = $request->user();
        $shop = Shop::where('user_id', $user->id)->first();
        if (!$shop) {
            return null;
        }

        return $shop;
    }

    public function userIndex(Request $request)
    {
        $orders = Order::with(['shop', 'items.sku.product', 'histories'])
            ->where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    public function userShow(Request $request, $orderId)
    {
        $order = Order::with(['shop', 'items.sku.product', 'histories'])
            ->where('user_id', $request->user()->id)
            ->where('id', $orderId)
            ->firstOrFail();

        return response()->json($order);
    }

    public function sellerIndex(Request $request)
    {
        $shop = $this->getSellerShop($request);
        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 404);
        }

        $orders = Order::with(['shop', 'items.sku.product', 'histories'])
            ->where('shop_id', $shop->id)
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json($orders);
    }

    private function transition(Request $request, $orderId, string $toStatus)
    {
        $shop = $this->getSellerShop($request);
        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 404);
        }
        $sellerUserId = $request->user()->id;

        $order = Order::where('id', $orderId)
            ->where('shop_id', $shop->id)
            ->firstOrFail();

        $fromStatus = $order->status;

        // Hạn chế logic chuyển trạng thái để tránh cập nhật vô tội vạ.
        $allowed = [
            'confirmed' => ['pending', 'confirmed'],
            'shipping' => ['confirmed', 'shipping'],
            'completed' => ['shipping', 'completed'],
            'cancelled' => ['pending', 'confirmed', 'shipping'],
        ];

        if (!isset($allowed[$toStatus]) || !in_array($fromStatus, $allowed[$toStatus], true)) {
            return response()->json([
                'message' => "Không thể chuyển trạng thái từ {$fromStatus} sang {$toStatus}",
            ], 422);
        }

        DB::beginTransaction();
        try {
            $order->status = $toStatus;
            $order->save();

            OrderHistory::create([
                'order_id' => $order->id,
                'from_status' => $fromStatus,
                'to_status' => $toStatus,
                'performed_by' => $sellerUserId,
                'note' => null,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Cập nhật trạng thái đơn hàng thành công',
                'order_id' => $order->id,
                'status' => $order->status,
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi cập nhật trạng thái',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function confirm(Request $request, $orderId)
    {
        return $this->transition($request, $orderId, 'confirmed');
    }

    public function shipping(Request $request, $orderId)
    {
        return $this->transition($request, $orderId, 'shipping');
    }

    public function completed(Request $request, $orderId)
    {
        return $this->transition($request, $orderId, 'completed');
    }

    public function cancelled(Request $request, $orderId)
    {
        return $this->transition($request, $orderId, 'cancelled');
    }
}

