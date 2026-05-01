<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Mail\AccountDeletionMail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Carbon\Carbon;

class AccountDeletionController extends Controller
{
    /**
     * Hiển thị trang xác nhận xóa (GET)
     * Đường dẫn: /account-delete/{token}
     */
    public function showConfirmationForm($token)
    {
        // Tìm user có token này
        $user = User::withTrashed()
            ->where('deletion_token', $token)
            ->whereNotNull('deletion_token')
            ->first();

        if (!$user) {
            return view('account_delete_error', [
                'error' => 'Link không hợp lệ hoặc đã hết hạn.',
                'title' => 'Lỗi xác nhận xóa'
            ]);
        }

        // Kiểm tra token hết hạn
        if ($user->deletion_expires_at && Carbon::parse($user->deletion_expires_at)->isPast()) {
            return view('account_delete_error', [
                'error' => 'Link xác nhận đã hết hạn (sau 7 ngày). Vui lòng liên hệ admin để được hỗ trợ.',
                'title' => 'Link hết hạn'
            ]);
        }

        return view('account_delete_confirm', [
            'user' => $user,
            'token' => $token,
            'title' => 'Xác nhận xóa tài khoản'
        ]);
    }

    /**
     * Xử lý xác nhận xóa (POST)
     */
    public function confirmDelete(Request $request, $token)
    {
        $user = User::withTrashed()
            ->where('deletion_token', $token)
            ->first();

        if (!$user) {
            return view('account_delete_error', [
                'error' => 'Token không hợp lệ.',
                'title' => 'Lỗi'
            ]);
        }

        // Hard delete
        $user->forceDelete();

        return view('account_delete_success', [
            'title' => 'Đã xóa tài khoản'
        ]);
    }

    /**
     * Xử lý hủy xóa (POST)
     */
    public function cancelDelete(Request $request, $token)
    {
        $user = User::withTrashed()
            ->where('deletion_token', $token)
            ->first();

        if (!$user) {
            return view('account_delete_error', [
                'error' => 'Token không hợp lệ.',
                'title' => 'Lỗi'
            ]);
        }

        // Khôi phục tài khoản
        $user->restore();
        $user->deletion_token = null;
        $user->deletion_expires_at = null;
        $user->save();

        return view('account_delete_cancel', [
            'title' => 'Đã hủy yêu cầu'
        ]);
    }
}
