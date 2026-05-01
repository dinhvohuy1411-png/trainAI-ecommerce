<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Illuminate\Http\Request;
use App\Models\Product;
use Illuminate\Support\Facades\DB; 

class ProductController extends Controller
{
    // =========================================================
    // LẤY DANH SÁCH SẢN PHẨM 
    // =========================================================
    public function index()
    {
        return Product::with([
            'shop',
            'category',
            'product_images',
            'skus.attributeValues.attribute'
        ])->get();
    }

    // =========================================================
    // LẤY CHI TIẾT 1 SẢN PHẨM 
    // =========================================================
    public function show($id)
    {
        $product = Product::with([
            'shop',
            'category',
            'product_images',
            'skus.attributeValues.attribute'
        ])->find($id);

        if (!$product) {
            return response()->json(['message' => 'Product not found'], 404);
        }

        return $product;
    }

    // =========================================================
    // THÊM SẢN PHẨM MỚI 
    // =========================================================
    public function store(Request $request)
    {
        try {
            $shop = \App\Models\Shop::where('user_id', $request->user()->id)->first();
            if (!$shop) {
                return response()->json(['message' => 'Bạn chưa có Cửa hàng để đăng sản phẩm!'], 403);
            }

            DB::beginTransaction();

            // 1. Tạo sản phẩm gốc
            $product = Product::create([
                'shop_id' => $shop->id,
                'category_id' => $request->category_id,
                'name' => $request->name,
                'slug' => Str::slug($request->name) . '-' . uniqid(),
                'description' => $request->description,
                'base_price' => $request->base_price,
            ]);

            // 2. LƯU NHIỀU LINK ẢNH (URL) CÙNG LÚC - ĐÃ FIX 
            $imageUrls = $request->input('image_urls', []);
            if (!empty($imageUrls)) {
                foreach ($imageUrls as $index => $url) {
                    if (!empty($url)) {
                        $product->product_images()->create([
                            'image_url' => $url, 
                            'is_thumbnail' => $index === 0 ? 1 : 0 // Ảnh đầu tiên làm ảnh bìa
                        ]);
                    }
                }
            } 

            // 3. XỬ LÝ PHÂN LOẠI
            $skusData = $request->input('skus');
            
            // Nếu data vô tình bị parse thành string thì dịch lại
            if (is_string($skusData)) {
                $skusData = json_decode($skusData, true);
            }

            if (!empty($skusData) && is_array($skusData) && count($skusData) > 0) {
                $attributeTracker = []; 

                foreach ($skusData as $skuItem) {
                    $newSku = $product->skus()->create([
                        'sku' => 'SKU-' . strtoupper(uniqid()),
                        'price' => $skuItem['price'],
                        'stock' => $skuItem['stock'] ?? 0,
                    ]);

                    if (isset($skuItem['attributes']) && is_array($skuItem['attributes'])) {
                        foreach ($skuItem['attributes'] as $attrName => $attrValue) {
                            
                            // Tạo Nhóm
                            if (!isset($attributeTracker[$attrName])) {
                                $attributeModel = \App\Models\Attribute::firstOrCreate(['name' => $attrName]);
                                $attributeTracker[$attrName]['model'] = $attributeModel;
                                $attributeTracker[$attrName]['values'] = []; 
                            }
                            $currentAttrModel = $attributeTracker[$attrName]['model'];

                            // Tạo Tùy chọn
                            if (!isset($attributeTracker[$attrName]['values'][$attrValue])) {
                                $attrValModel = \App\Models\ProductAttributeValue::firstOrCreate([
                                    'product_id' => $product->id,
                                    'attribute_id' => $currentAttrModel->id,
                                    'value' => $attrValue
                                ]);
                                $attributeTracker[$attrName]['values'][$attrValue] = $attrValModel;
                            }
                            $currentAttrValModel = $attributeTracker[$attrName]['values'][$attrValue];

                            // Nối vào bảng trung gian
                            DB::table('sku_values')->insert([
                                'product_sku_id' => $newSku->id,
                                'product_attribute_value_id' => $currentAttrValModel->id
                            ]);
                        }
                    }
                }
            } else {
                $product->skus()->create([
                    'sku' => 'SKU-' . strtoupper(uniqid()),
                    'price' => $request->base_price,
                    'stock' => $request->stock ?? 0,
                ]);
            }

            DB::commit();
            $product->load(['product_images', 'skus.attributeValues.attribute']);

            return response()->json([
                'message' => 'Đăng sản phẩm thành công!',
                'product' => $product
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi thêm sản phẩm!',
                'error' => $e->getMessage(),
                'line' => $e->getLine(),
                'file' => $e->getFile()
            ], 500);
        }
    }

    // =========================================================
    // CẬP NHẬT SẢN PHẨM 
    // =========================================================
    public function update(Request $request, $id)
    {
        try {
            $user = $request->user();
            $shop = \App\Models\Shop::where('user_id', $user->id)->first();

            if (!$shop) {
                return response()->json(['message' => 'Bạn chưa có shop'], 403);
            }

            $product = \App\Models\Product::where('shop_id', $shop->id)->find($id);

            if (!$product) {
                return response()->json(['message' => 'Không tìm thấy sản phẩm'], 404);
            }

            DB::beginTransaction();

            // 1. Cập nhật thông tin cơ bản
            $product->update([
                'name' => $request->name,
                'category_id' => $request->category_id,
                'base_price' => $request->base_price,
                'description' => $request->description,
            ]);

            // 2. CẬP NHẬT NHIỀU LINK ẢNH (URL) - ĐÃ FIX 
            $imageUrls = $request->input('image_urls', []);
            if (!empty($imageUrls)) {
                // Xóa toàn bộ ảnh cũ để chép ảnh mới vào
                $product->product_images()->delete(); 
                
                foreach ($imageUrls as $index => $url) {
                    if (!empty($url)) {
                        $product->product_images()->create([
                            'image_url' => $url,
                            'is_thumbnail' => $index === 0 ? 1 : 0
                        ]);
                    }
                }
            }

            // 3. XỬ LÝ SKU MỚI/CŨ 
            $skusData = $request->input('skus');
            if (is_string($skusData)) {
                $skusData = json_decode($skusData, true);
            }
            $sentSkuIds = []; 

            if (!empty($skusData) && is_array($skusData) && count($skusData) > 0) {
                foreach ($skusData as $skuItem) {
                    
                    if (isset($skuItem['id'])) {
                        $skuModel = $product->skus()->find($skuItem['id']);
                        if ($skuModel) {
                            $skuModel->update([
                                'price' => $skuItem['price'],
                                'stock' => $skuItem['stock']
                            ]);
                        }
                    } else {
                        $skuModel = $product->skus()->create([
                            'sku' => 'SKU-' . strtoupper(uniqid()),
                            'price' => $skuItem['price'],
                            'stock' => $skuItem['stock'] ?? 0,
                        ]);
                    }

                    if ($skuModel) {
                        $sentSkuIds[] = $skuModel->id;
                        DB::table('sku_values')->where('product_sku_id', $skuModel->id)->delete();

                        if (isset($skuItem['attributes']) && is_array($skuItem['attributes'])) {
                            foreach ($skuItem['attributes'] as $attrName => $attrValue) {
                                $attrModel = \App\Models\Attribute::firstOrCreate(['name' => $attrName]);
                                $attrValModel = \App\Models\ProductAttributeValue::firstOrCreate([
                                    'product_id' => $product->id,
                                    'attribute_id' => $attrModel->id,
                                    'value' => $attrValue
                                ]);
                                DB::table('sku_values')->insert([
                                    'product_sku_id' => $skuModel->id,
                                    'product_attribute_value_id' => $attrValModel->id
                                ]);
                            }
                        }
                    }
                }
            } else {
                $skuModel = $product->skus()->updateOrCreate(
                    ['sku' => 'Mặc định'],
                    ['price' => $request->base_price, 'stock' => $request->stock ?? 0]
                );
                $sentSkuIds[] = $skuModel->id;
            }

            // 4. XÓA CÁC SKU BỊ BỎ
            try {
                $product->skus()->whereNotIn('id', $sentSkuIds)->delete();
            } catch (\Exception $e) {
                $product->skus()->whereNotIn('id', $sentSkuIds)->update(['stock' => 0]);
            }

            DB::commit();
            $product->load(['product_images', 'skus.attributeValues.attribute']);

            return response()->json([
                'message' => 'Cập nhật sản phẩm thành công!', 
                'product' => $product
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi cập nhật sản phẩm!',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // =========================================================
    // XÓA SẢN PHẨM
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
            $product->product_images()->delete();
            $product->skus()->delete();
            $product->delete();

            return response()->json(['message' => 'Xóa sản phẩm thành công!']);
            
        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() == "23000") {
                return response()->json([
                    'error' => 'Không thể xóa! Sản phẩm này đã phát sinh đơn hàng trong quá khứ. Vui lòng cập nhật "Tồn kho = 0" để ngưng bán sản phẩm này.'
                ], 400);
            }
            return response()->json(['error' => 'Không thể xóa do lỗi hệ thống.'], 500);
        }
    }
}