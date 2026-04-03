<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Product; // 

class ProductController extends Controller
{
    // Lấy danh sách sản phẩm
    public function index()
    {
        return Product::with([
            'shop',
            'category',
            'product_images',
            'skus'
        ])->get();
    }

    // Lấy chi tiết 1 sản phẩm
    public function show($id)
    {
        $product = Product::with([
            'shop',
            'category',
            'product_images',
            'skus'
        ])->find($id);

        if (!$product) {
            return response()->json([
                'message' => 'Product not found'
            ], 404);
        }

        return $product;
    }
    // Thêm sản phẩm mới (Dành cho Seller)
  public function store(Request $request)
    {
        try {
            $shop = \App\Models\Shop::where('user_id', $request->user()->id)->first(); 
            if (!$shop) {
                return response()->json(['message' => 'Bạn chưa có Cửa hàng để đăng sản phẩm!'], 403);
            }

            // 1. Tạo sản phẩm
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $request->category_id,
                'name' => $request->name,
                'slug' => \Illuminate\Support\Str::slug($request->name) . '-' . uniqid(), 
                'description' => $request->description,
                'base_price' => $request->base_price,
            ]);

            // 2. Lưu LINK ẢNH
            if ($request->image_url) {
                $product->product_images()->create([
                    'image_url' => $request->image_url,
                    'is_thumbnail' => 1
                ]);
            }

            // 3. XỬ LÝ SKU "BẤT TỬ"
            $skusData = $request->input('skus'); // Lấy mảng skus gửi từ React
            
            if (!empty($skusData) && is_array($skusData)) {
                foreach ($skusData as $skuData) {
                    $product->skus()->create([
                        'sku' => $skuData['sku_code'], // Sẽ lưu chữ "Đen", "Trắng"
                        'price' => $skuData['price'],
                        'stock' => $skuData['stock'] ?? 0,
                    ]);
                }
            } else {
                $product->skus()->create([
                    'sku' => 'SKU-' . strtoupper(uniqid()),
                    'price' => $request->base_price,
                    'stock' => $request->stock ?? 0,
                ]);
            }

            $product->load(['product_images', 'skus']);

            return response()->json([
                'message' => 'Đăng sản phẩm thành công!',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Lỗi khi thêm sản phẩm!',
                'error' => $e->getMessage() 
            ], 500);
        }
    }
   // =========================================================
    // 1. HÀM CẬP NHẬT SẢN PHẨM (Sửa) - Phiên bản chống lỗi Khóa ngoại
    // =========================================================
    public function update(Request $request, $id)
    {
        $user = $request->user();
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 403);
        }

        $product = \App\Models\Product::where('shop_id', $shop->id)->find($id);

        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        // 1. Cập nhật thông tin cơ bản
        $product->update([
            'name' => $request->name,
            'category_id' => $request->category_id,
            'base_price' => $request->base_price,
            'description' => $request->description,
        ]);

        // 2. Cập nhật ảnh
        if ($request->image_url) {
            $product->product_images()->delete();
            $product->product_images()->create([
                'image_url' => $request->image_url,
                'is_thumbnail' => 1
            ]);
        }

        // 3. Cập nhật SKU (Phân loại) - Dùng updateOrCreate để không bị lỗi đơn hàng cũ
        if ($request->has('skus') && count($request->skus) > 0) {
            $sentSkuCodes = collect($request->skus)->pluck('sku_code')->toArray();
            
            // Xóa những SKU mà user đã ấn nút 'X' bỏ đi (bỏ qua lỗi nếu nó dính khóa ngoại)
            try {
                $product->skus()->whereNotIn('sku', $sentSkuCodes)->delete();
            } catch (\Exception $e) {}

            // Cập nhật hoặc tạo mới SKU
            foreach ($request->skus as $skuData) {
                $product->skus()->updateOrCreate(
                    ['sku' => $skuData['sku_code']], // Tìm xem có phân loại này chưa
                    [
                        'price' => $skuData['price'],
                        'stock' => $skuData['stock'],
                    ]
                );
            }
        } else {
            try {
                $product->skus()->where('sku', '!=', 'Mặc định')->delete();
            } catch (\Exception $e) {}

            $product->skus()->updateOrCreate(
                ['sku' => 'Mặc định'],
                [
                    'price' => $request->base_price,
                    'stock' => $request->stock ?? 0,
                ]
            );
        }

        return response()->json(['message' => 'Cập nhật sản phẩm thành công!', 'product' => $product]);
    }

    // =========================================================
    // 2. HÀM XÓA SẢN PHẨM (Có thông báo thân thiện nếu đã có đơn hàng)
    // =========================================================
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        $shop = \App\Models\Shop::where('user_id', $user->id)->first();

        if (!$shop) {
            return response()->json(['message' => 'Bạn chưa có shop'], 403);
        }

        $product = \App\Models\Product::where('shop_id', $shop->id)->find($id);

        if (!$product) {
            return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
        }

        try {
            // Cố gắng dọn dẹp và xóa
            $product->product_images()->delete();
            $product->skus()->delete();
            $product->delete();

            return response()->json(['message' => 'Xóa sản phẩm thành công!']);
            
        } catch (\Illuminate\Database\QueryException $e) {
            // Lỗi 23000: Integrity constraint violation (Dính khóa ngoại đơn hàng)
            if ($e->getCode() == "23000") {
                return response()->json([
                    'error' => 'Không thể xóa! Sản phẩm này đã phát sinh đơn hàng trong quá khứ. Vui lòng cập nhật "Tồn kho = 0" để ngưng bán sản phẩm này.'
                ], 400);
            }
            
            // Lỗi khác
            return response()->json(['error' => 'Không thể xóa do lỗi hệ thống.'], 500);
        }
    }
}