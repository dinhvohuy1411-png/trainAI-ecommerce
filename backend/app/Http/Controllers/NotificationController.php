<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class NotificationController extends Controller
{
    // Lấy danh sách thông báo của user hiện tại
    public function index(Request $request)
    {
        $user = Auth::user();
        
        $notifications = Notification::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(20)
            ->get();

        return response()->json([
            'data' => $notifications
        ]);
    }

    // Lấy số lượng thông báo chưa đọc
    public function getUnreadCount(Request $request)
    {
        $user = Auth::user();
        
        $unreadCount = Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        return response()->json([
            'unread_count' => $unreadCount
        ]);
    }

    // Đánh dấu thông báo là đã đọc
    public function markAsRead(Request $request, $id)
    {
        $user = Auth::user();
        
        $notification = Notification::where('id', $id)
            ->where('user_id', $user->id)
            ->first();

        if (!$notification) {
            return response()->json(['error' => 'Thông báo không tìm thấy'], 404);
        }

        $notification->update(['is_read' => true]);

        return response()->json([
            'message' => 'Đánh dấu đã đọc thành công',
            'data' => $notification
        ]);
    }

    // Đánh dấu tất cả thông báo là đã đọc
    public function markAllAsRead(Request $request)
    {
        $user = Auth::user();
        
        Notification::where('user_id', $user->id)
            ->where('is_read', false)
            ->update(['is_read' => true]);

        return response()->json([
            'message' => 'Đánh dấu tất cả đã đọc thành công'
        ]);
    }
}
