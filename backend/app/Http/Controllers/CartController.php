<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Cart;
use App\Models\CartItem;
use App\Models\ProductSku;

class CartController extends Controller
{
    // Thêm sản phẩm vào giỏ 
    public function addToCart(Request $request) {
        $user = Auth::user();
        
        $request->validate([
            'product_sku_id' => 'required|exists:product_skus,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $cart = Cart::firstOrCreate(['user_id' => $user->id]);

        $item = CartItem::where('cart_id', $cart->id)
            ->where('product_sku_id', $request->product_sku_id)->first();

        if ($item) {
            $item->quantity += $request->quantity;
            $item->save();
        } else {
            CartItem::create([
                'cart_id' => $cart->id,
                'product_sku_id' => $request->product_sku_id,
                'quantity' => $request->quantity
            ]);
        }
        return response()->json(['message' => 'Thêm vào giỏ hàng thành công']);
    }

    //Lấy danh sách giỏ hàng
    public function getCart() {
        $user = Auth::user();
        
        $cart = Cart::with(['items.sku.product.shop', 'items.sku.product.product_images'])
            ->where('user_id', $user->id)->first();

        if (!$cart) return response()->json([]);

        // Group item theo tên Shop 
        $grouped = $cart->items->groupBy(function($item) {
            return $item->sku->product->shop->name; 
        });

        // Map lại dữ liệu để React dễ dùng
        $result = $grouped->map(function ($items) {
            return $items->map(function ($item) {
                // Lấy ảnh: Ưu tiên ảnh của SKU, nếu không có thì lấy ảnh đầu tiên của Product
                $image = $item->sku->image ?? ($item->sku->product->product_images->first()->image_url ?? null);

                return [
                    'id' => $item->id,                  // ID của dòng trong giỏ hàng (để xóa/sửa)
                    'sku_id' => $item->product_sku_id,  // ID của SKU (để add thêm số lượng)
                    'product_name' => $item->sku->product->name,
                    'sku_code' => $item->sku->sku,      // Tên phân loại (VD: Đen - XL)
                    'price' => $item->sku->price,
                    'quantity' => $item->quantity,
                    'image' => $image,
                    'shop_id' => $item->sku->product->shop_id
                ];
            });
        });

        return response()->json($result);
    }
    
    // 3. Cập nhật số lượng
    public function updateCart(Request $request) {
        $request->validate([
            'cart_item_id' => 'required|exists:cart_items,id',
            'quantity' => 'required|integer|min:1'
        ]);

        $user = Auth::user();

        // Tìm item và đảm bảo nó thuộc về user đang đăng nhập (Bảo mật)
        $item = CartItem::where('id', $request->cart_item_id)
            ->whereHas('cart', function($q) use ($user) {
                $q->where('user_id', $user->id);
            })->first();

        if (!$item) {
            return response()->json(['message' => 'Sản phẩm không tồn tại trong giỏ'], 404);
        }

        $item->quantity = $request->quantity;
        $item->save();

        return response()->json(['message' => 'Cập nhật thành công']);
    }

    // 4. Xóa sản phẩm
    public function removeItem($id) {
        $user = Auth::user();

        $item = CartItem::where('id', $id)
            ->whereHas('cart', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            })
            ->first();

        if (!$item) {
            return response()->json(['message' => 'Sản phẩm không tồn tại trong giỏ'], 404);
        }

        $item->delete();
        return response()->json(['message' => 'Đã xóa sản phẩm']);
    }
}