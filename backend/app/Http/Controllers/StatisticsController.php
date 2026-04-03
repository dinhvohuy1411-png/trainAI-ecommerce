<?php

namespace App\Http\Controllers;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\DB;

use App\Models\Product;
use Illuminate\Http\Request;

use App\Models\Shop;

class StatisticsController extends Controller
{
    // Admin - Thống kê toàn sàn
    public function adminDashboard()
    {
        $user = auth()->user();

        if ($user->role !== 'admin') {
            return response()->json([
                'message' => 'Không có quyền'
            ], 403);
        }

        // Doanh thu toàn sàn
        $totalRevenue = Order::where('status', 'completed')
            ->sum(DB::raw('total_price'));

        // Số đơn hàng
        $totalOrders = Order::count();

        // Sản phẩm bán chạy (top 5)
        $bestSellers = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'total_revenue' => $totalRevenue ?? 0,
            'total_orders' => $totalOrders ?? 0,
            'best_sellers' => $bestSellers ?? []
        ]);
    }

    // Seller - Thống kê riêng
    public function sellerDashboard()
    {
        $user = auth()->user();

        // Lấy shop của seller
        $shop = Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json([
                'message' => 'Bạn chưa có shop'
            ], 404);
        }

        // Doanh thu của shop
        $revenue = Order::where('shop_id', $shop->id)
            ->where('status', 'completed')
            ->sum(DB::raw('total_price'));

        // Số đơn hàng
        $orders = Order::where('shop_id', $shop->id)->count();

        // Sản phẩm bán chạy
        $bestProducts = DB::table('order_items')
            ->join('products', 'order_items.product_id', '=', 'products.id')
            ->where('products.shop_id', $shop->id)
            ->select('products.name', DB::raw('SUM(order_items.quantity) as total_sold'))
            ->groupBy('products.id', 'products.name')
            ->orderByDesc('total_sold')
            ->limit(5)
            ->get();

        return response()->json([
            'revenue' => $revenue ?? 0,
            'orders' => $orders ?? 0,
            'best_products' => $bestProducts ?? []
        ]);
    }
    // ==========================================================
    // GỌI TRẠM AI PYTHON ĐỂ DỰ BÁO DOANH SỐ (PROPHET MODEL)
    // ==========================================================
    public function getProductForecast($id)
    {
        $product = Product::findOrFail($id);

        // 1. Lấy dữ liệu lịch sử bán hàng từ Database (gom nhóm theo ngày)
        $historicalData = DB::table('order_items')
            ->join('orders', 'order_items.order_id', '=', 'orders.id')
            ->join('product_skus', 'order_items.product_sku_id', '=', 'product_skus.id')
            ->where('product_skus.product_id', $id)
            ->whereIn('orders.status', ['pending', 'confirmed', 'shipping', 'completed']) // Chỉ tính đơn thành công
            ->select(DB::raw('DATE(orders.created_at) as date'), DB::raw('SUM(order_items.quantity) as quantity'))
            ->groupBy(DB::raw('DATE(orders.created_at)'))
            ->orderBy('date', 'asc')
            ->get();

        // Nếu sản phẩm mới đăng, chưa bán được đến 7 ngày khác nhau thì AI không đủ data để học
        if ($historicalData->count() < 7) {
            return response()->json([
                'message' => 'Sản phẩm chưa đủ dữ liệu để AI học (Cần ít nhất 7 ngày có giao dịch)'
            ], 400);
        }

        // 2. Bắn dữ liệu sang cổng 8000 (Trạm AI Python)
        try {
            $response = Http::post('http://127.0.0.1:8000/api/predict-demand', [
                'product_id' => $product->id,
                'historical_data' => $historicalData
            ]);

            $aiResult = $response->json();

            if (isset($aiResult['status']) && $aiResult['status'] === 'success') {
                // Tính toán số tồn kho thực tế hiện tại
                $currentStock = $product->skus()->sum('stock');
                $predictedDemand = $aiResult['total_predicted_7_days'];

                return response()->json([
                    'product_name' => $product->name,
                    'current_stock' => (int) $currentStock,
                    'total_predicted_7_days' => $predictedDemand,
                    'is_stock_warning' => $predictedDemand > $currentStock, // AI tính toán nguy cơ cháy hàng
                    'forecast_details' => $aiResult['forecast_details']
                ]);
            }

            return response()->json(['message' => 'AI Server trả về lỗi: ' . json_encode($aiResult)], 400);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Không thể kết nối đến Trạm AI. Vui lòng kiểm tra xem server Python đã chạy chưa.'
            ], 500);
        }
    }
}
