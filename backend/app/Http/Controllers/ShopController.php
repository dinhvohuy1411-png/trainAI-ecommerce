<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop;
use App\Models\UserAddress;
use Illuminate\Support\Str;

class ShopController extends Controller
{
    // ==============================
    // SELLER TẠO SHOP
    // ==============================
    public function store(Request $request)
    {
        $user = auth()->user();

        // Support multiple roles separated by comma
        $roles = array_map('trim', explode(',', $user->role));
        $isAllowed = in_array('user', $roles) || in_array('seller', $roles) || in_array($user->role, ['user', 'seller']);
        
        if (!$isAllowed) {
            return response()->json([
                'message' => 'Không có quyền'
            ], 403);
        }
        if (Shop::where('user_id', $user->id)->exists()) {
            return response()->json([
                'message' => 'Bạn đã có shop rồi'
            ], 400);
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string|max:1000',
            'logo' => 'nullable|image|mimes:jpg,jpeg,png|max:2048',
            'addresses' => 'nullable|string'
        ]);

        $slug = Str::slug($data['name']);
        $originalSlug = $slug;
        $count = 1;

        while (Shop::where('slug', $slug)->exists()) {
            $slug = $originalSlug . '-' . $count++;
        }

        $logoPath = null;
        if ($request->hasFile('logo')) {
            $logoPath = $request->file('logo')->store('shops', 'public');
        }

        $shop = Shop::create([
            'user_id' => $user->id,
            'name' => $data['name'],
            'slug' => $slug,
            'description' => $data['description'] ?? null,
            'logo' => $logoPath,
            'rating' => 0,        
            'is_verified' => 0    
        ]);
        $addresses = json_decode($request->addresses, true);

        if (!$addresses || count($addresses) == 0) {
            return response()->json(['message' => 'Thiếu địa chỉ'], 400);
        }

        $addr = $addresses[0];

        UserAddress::create([
            'user_id' => $user->id,
            'recipient_name' => $addr['receiver'],
            'recipient_phone' => $addr['phone'],
            'address_detail' => $addr['detail'],
            'city' => $addr['province'],
            'district' => $addr['district'],
            'ward' => $addr['ward']
        ]);
        $user->phone=$addr['phone'];
        
        // Update user role to include seller
        $roles = explode(',', $user->role);
        $roles = array_map('trim', $roles);
        if (!in_array('seller', $roles)) {
            $roles[] = 'seller';
            $user->role = implode(',', $roles);
        }
        $user->save();
        return response()->json([
            'message' => 'Đăng ký shop thành công, vui lòng chờ duyệt',
            'shop' => $shop
        ], 201);
    }

    // ==============================
    // LẤY SHOP CỦA TÔI
    // ==============================
    public function myShop()
    {
        $user = auth()->user();

        $shop = Shop::where('user_id', $user->id)
            ->with([
                'products.product_images',
                'products.skus.attributeValues.attribute', // 🚀 ĐIỂM NÂNG CẤP LÀ Ở ĐÂY!
                'products.category'
            ])
            ->first();

        if (!$shop) {
            return response()->json([
                'message' => 'Bạn chưa có shop'
            ], 404);
        }

        return response()->json($shop);
    }
}