<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop;
use App\Models\User; // Thêm dòng này
use Exception;

class AdminShopController extends Controller
{
    // Lấy danh sách shop chưa duyệt
    public function index()
    {
        $shops = Shop::with('user')->where('is_verified', 0)->get();
        
        return response()->json($shops->map(function($shop) {
            return [
                'id' => $shop->id,
                'name' => $shop->name,
                'description' => $shop->description,
                'is_verified' => $shop->is_verified,
                'user_id' => $shop->user_id,
                'created_at' => $shop->created_at,
                'updated_at' => $shop->updated_at,
                'user' => $shop->user ? [
                    'id' => $shop->user->id,
                    'name' => $shop->user->name,
                    'email' => $shop->user->email,
                    'phone' => $shop->user->phone,
                ] : null,
            ];
        }));
    }

    // Duyệt shop
    public function approve($id)
    {
        try {
            // 1. Tìm shop theo ID
            $shop = Shop::find($id);
            
            if (!$shop) {
                return response()->json(['message' => '❌ Không tìm thấy shop này'], 404);
            }

            // 2. Duyệt shop
            $shop->is_verified = 1;
            $shop->save();
            
            // 3. CẬP NHẬT ROLE CỦA CHỦ SHOP (SỬA LỖI ADMIN BỊ ĐỔI ROLE)
            // Thay vì dùng $shop->user, ta tìm trực tiếp User theo user_id của shop
            $owner = User::find($shop->user_id);
            
            if ($owner) {
                // Kiểm tra lần cuối để đảm bảo không đổi nhầm Admin (phòng hờ)
                if ($owner->role !== 'admin') {
                    $owner->role = 'seller';
                    $owner->save();
                }
            }
            
            return response()->json(['message' => '✅ Shop đã duyệt! Quyền Seller đã được cấp cho chủ shop (ID: '.$shop->user_id.').']);

        } catch (Exception $e) {
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }

    // Từ chối shop
    public function reject($id)
    {
        try {
            $shop = Shop::find($id);
            
            if (!$shop) {
                return response()->json(['message' => '❌ Không tìm thấy shop'], 404);
            }

            $shop->delete(); 
            
            return response()->json(['message' => '✅ Đã từ chối và gỡ bỏ yêu cầu mở shop']);

        } catch (Exception $e) {
            return response()->json(['message' => 'Lỗi: ' . $e->getMessage()], 500);
        }
    }
}