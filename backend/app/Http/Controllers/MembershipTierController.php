<?php

namespace App\Http\Controllers;

use App\Models\MembershipTier;
use Illuminate\Http\Request;

class MembershipTierController extends Controller
{
    // Lấy danh sách tất cả các hạng (sắp xếp theo mốc tiền tăng dần)
    public function index()
    {
        $tiers = MembershipTier::orderBy('min_spent', 'asc')->get();
        return response()->json($tiers);
    }

    // Admin tạo hạng mới (Ví dụ: Hạng Vàng, Kim Cương...)
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:100',
            'min_spent' => 'required|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'free_shipping_quota' => 'nullable|integer|min:0',
            'custom_benefits' => 'nullable|array', // Admin gửi lên mảng ['Quà SN', 'Hỗ trợ 24/7']
            'is_active' => 'boolean'
        ]);

        $tier = MembershipTier::create($validated);

        return response()->json([
            'message' => 'Tạo hạng thành viên thành công',
            'data' => $tier
        ], 201);
    }

    // Admin cập nhật thông tin hạng
    public function update(Request $request, $id)
    {
        $tier = MembershipTier::findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:100',
            'min_spent' => 'sometimes|numeric|min:0',
            'discount_percent' => 'nullable|numeric|min:0|max:100',
            'free_shipping_quota' => 'nullable|integer|min:0',
            'custom_benefits' => 'nullable|array',
            'is_active' => 'boolean'
        ]);

        $tier->update($validated);

        return response()->json([
            'message' => 'Cập nhật hạng thành công',
            'data' => $tier
        ]);
    }

    // Xóa hạng (Chỉ xóa khi không có ai đang ở hạng này, hoặc set null cho user)
    public function destroy($id)
    {
        $tier = MembershipTier::findOrFail($id);
        $tier->delete();

        return response()->json(['message' => 'Đã xóa hạng thành viên']);
    }
}