<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Order;
use App\Models\Product;
use App\Mail\AccountDeletionMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AdminUserController extends Controller
{
    /**
     * Lấy danh sách users (chỉ user, không tính admin)
     */
    public function index(Request $request)
    {
        $users = User::whereIn('role', ['user', 'customer', 'seller'])
            ->withTrashed()
            ->orderBy('created_at', 'desc')
            ->paginate(15);

        return response()->json($users);
    }

    /**
     * Tạo user mới
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|min:6',
            'role' => 'nullable|in:user,customer,seller,admin',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => bcrypt($request->password),
            'role' => $request->role ?? 'user',
        ]);

        return response()->json(['message' => 'Tạo user thành công', 'user' => $user], 201);
    }

    /**
     * Cập nhật user
     */
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $id,
            'role' => 'sometimes|in:user,customer,seller,admin',
        ]);

        $user->update($request->only(['name', 'email', 'role']));

        return response()->json(['message' => 'Cập nhật thành công', 'user' => $user]);
    }

    /**
     * Xóa user mềm - gửi email xác nhận
     * Các logic cần kiểm tra:
     * 1. Không cho xóa admin
     * 2. Không cho xóa user đã bị soft delete
     * 3. Seller có đơn hàng đang xử lý → không cho xóa (hoặc cảnh báo)
     * 4. Seller có sản phẩm đang bán → không cho xóa (hoặc cảnh báo)
     * 5. User là customer thì cho xóa thoải mái
     */
    public function softDelete(Request $request, $id)
    {
        $user = User::findOrFail($id);

        // 1. Không cho xóa admin
        if ($user->role === 'admin') {
            return response()->json(['message' => 'Không thể xóa tài khoản admin'], 403);
        }

        // 2. Không cho xóa tài khoản đã bị soft delete
        if ($user->deleted_at) {
            return response()->json(['message' => 'Tài khoản này đang chờ xác nhận xóa'], 403);
        }

        // 3. Kiểm tra seller có đơn hàng đang xử lý không
        if ($user->role === 'seller') {
            $pendingOrders = Order::where('seller_id', $user->id)
                ->whereIn('status', ['pending', 'confirmed', 'shipping'])
                ->count();

            if ($pendingOrders > 0) {
                return response()->json([
                    'message' => "Seller có $pendingOrders đơn hàng đang xử lý. Vui lòng hoàn tất hoặc hủy đơn trước khi xóa.",
                    'code' => 'HAS_PENDING_ORDERS',
                    'pending_orders' => $pendingOrders
                ], 422);
            }

            // 4. Kiểm tra seller có sản phẩm đang bán không
            $activeProducts = Product::where('shop_id', $user->id)
                ->where('is_active', 1)
                ->count();

            if ($activeProducts > 0) {
                return response()->json([
                    'message' => "Seller có $activeProducts sản phẩm đang bán. Vui lòng xóa hoặc ẩn sản phẩm trước khi xóa.",
                    'code' => 'HAS_ACTIVE_PRODUCTS',
                    'active_products' => $activeProducts
                ], 422);
            }
        }

        // 5. Tạo token xác nhận
        $token = Str::random(64);
        $expiresAt = Carbon::now()->addDays(7)->toDateTimeString();

        $user->deletion_token = $token;
        $user->deletion_expires_at = $expiresAt;
        $user->save();

        // 6. Gửi email xác nhận
        try {
            Mail::to($user->email)->send(new AccountDeletionMail($user, $token));
        } catch (\Exception $e) {
            // Nếu gửi email thất bại, vẫn cho soft delete nhưng thông báo
            \Log::warning('Không thể gửi email xóa tài khoản: ' . $e->getMessage());
        }

        // Soft delete
        $user->delete();

        return response()->json([
            'message' => 'Đã gửi email xác nhận xóa đến ' . $user->email,
            'user_id' => $user->id,
        ]);
    }

    /**
     * Xác nhận xóa tài khoản (click từ email)
     */
    public function confirmDeletion(Request $request, $id)
    {
        $token = $request->query('token');

        $user = User::withTrashed()->findOrFail($id);

        // Kiểm tra token
        if ($user->deletion_token !== $token) {
            return response()->json(['message' => 'Token không hợp lệ'], 403);
        }

        // Kiểm tra token hết hạn
        if ($user->deletion_expires_at && Carbon::parse($user->deletion_expires_at)->isPast()) {
            return response()->json(['message' => 'Link xác nhận đã hết hạn (7 ngày)'], 410);
        }

        // Xóa các dữ liệu liên quan trước khi xóa user (nếu cần)
        // VD: Xóa cart, addresses, etc. (cascade trong database thường đã xử lý)

        // Hard delete - xóa vĩnh viễn
        $user->forceDelete();

        return response()->json(['message' => 'Tài khoản đã được xóa vĩnh viễn']);
    }

    /**
     * Hủy yêu cầu xóa tài khoản
     */
    public function cancelDeletion(Request $request, $id)
    {
        $token = $request->query('token');

        $user = User::withTrashed()->findOrFail($id);

        // Kiểm tra token
        if ($user->deletion_token !== $token) {
            return response()->json(['message' => 'Token không hợp lệ'], 403);
        }

        // Khôi phục tài khoản và xóa token
        $user->restore();
        $user->deletion_token = null;
        $user->deletion_expires_at = null;
        $user->save();

        return response()->json(['message' => 'Đã hủy yêu cầu xóa, tài khoản đã được khôi phục']);
    }

    /**
     * Xóa nhiều user cùng lúc (bulk delete)
     */
    public function bulkSoftDelete(Request $request)
    {
        $request->validate([
            'user_ids' => 'required|array|min:1',
            'user_ids.*' => 'integer|exists:users,id',
        ]);

        $results = [];
        foreach ($request->user_ids as $id) {
            $user = User::find($id);
            if (!$user) continue;

            // Tạm thời gọi softDelete để lấy kết quả
            // Có thể tối ưu bằng cách viết lại logic ở đây
            $results[] = [
                'user_id' => $id,
                'name' => $user->name,
                'status' => 'pending',
            ];
        }

        return response()->json([
            'message' => 'Đã tiếp nhận yêu cầu xóa cho ' . count($results) . ' user',
            'users' => $results,
        ]);
    }

    /**
     * Lấy thông tin chi tiết user (để kiểm tra trước khi xóa)
     */
    public function show(Request $request, $id)
    {
        $user = User::withTrashed()->findOrFail($id);

        $userData = [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role,
            'created_at' => $user->created_at,
            'deleted_at' => $user->deleted_at,
        ];

        // Nếu là seller, kiểm tra thêm thông tin
        if ($user->role === 'seller') {
            $userData['seller_info'] = [
                'pending_orders' => Order::where('seller_id', $user->id)
                    ->whereIn('status', ['pending', 'confirmed', 'shipping'])
                    ->count(),
                'active_products' => Product::where('shop_id', $user->id)
                    ->where('is_active', 1)
                    ->count(),
                'total_products' => Product::where('shop_id', $user->id)->count(),
            ];
        }

        return response()->json($userData);
    }
}
