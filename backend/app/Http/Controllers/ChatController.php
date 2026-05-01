<?php

namespace App\Http\Controllers;

use App\Models\Conversation;
use App\Models\Message;
use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ChatController extends Controller
{
    private function isSellerRole($role): bool
    {
        return $role === 'seller' || $role === 2 || $role === '2';
    }

    private function isUserRole($role): bool
    {
        return $role === 'user' || $role === 1 || $role === '1';
    }

    public function listConversations(Request $request)
    {
        $user = $request->user();

        if ($this->isSellerRole($user->role)) {
            $shop = Shop::where('user_id', $user->id)->first();
            if (!$shop) {
                return response()->json([], 200);
            }

            $conversations = Conversation::with(['messages', 'shop'])
         ->where('shop_id', $shop->id)
            ->latest()
            ->get();
                
            return response()->json($conversations);
        }

        if ($this->isUserRole($user->role)) {
       $conversations = Conversation::with(['messages', 'shop'])
    ->where('user_id', $user->id)
    ->latest()
    ->get();

            return response()->json($conversations);
        }

        return response()->json(['message' => 'Unauthorized.'], 403);
    }
    
    public function createConversation(Request $request)
    {
        $user = $request->user();
        if (!$this->isUserRole($user->role)) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $request->validate([
            'shop_id' => 'required|exists:shops,id',
        ]);

        $shop = Shop::findOrFail($request->shop_id);

        // Tạo conversation theo cặp (user, shop) để tránh trùng chat.
        $conversation = Conversation::firstOrCreate(
            [
                'user_id' => $user->id,
                'shop_id' => $shop->id,
            ],
            []
        );

        return response()->json($conversation);
    }

    public function listMessages(Request $request, $conversationId)
    {
        $conversation = Conversation::with(['messages'])->findOrFail($conversationId);

        $user = $request->user();

        $isAllowed = false;
        if ($this->isSellerRole($user->role)) {
            $shop = Shop::find($conversation->shop_id);
            $isAllowed = $shop && (int) $shop->user_id === (int) $user->id;
        } elseif ($this->isUserRole($user->role)) {
            $isAllowed = (int) $conversation->user_id === (int) $user->id;
        } else {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$isAllowed) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $messages = Message::where('conversation_id', $conversation->id)
            ->orderBy('created_at', 'asc')
            ->get();

        return response()->json([
            'conversation_id' => $conversation->id,
            'messages' => $messages,
        ]);
    }

    public function sendMessage(Request $request, $conversationId)
    {
        
        $request->validate([
            'content' => 'required|string|max:2000',
        ]);

        $user = $request->user();
        $conversation = Conversation::findOrFail($conversationId);

        // Kiểm tra quyền: user hoặc seller thuộc về 1 trong 2 bên chat.
        $isAllowed = false;
        if ($this->isSellerRole($user->role)) {
            $shop = Shop::find($conversation->shop_id);
            $isAllowed = $shop && (int) $shop->user_id === (int) $user->id;
        } elseif ($this->isUserRole($user->role)) {
            $isAllowed = (int) $conversation->user_id === (int) $user->id;
        } else {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        if (!$isAllowed) {
            return response()->json(['message' => 'Unauthorized.'], 403);
        }

        $content = $request->content;
     
        DB::beginTransaction();
        try {
            $message = Message::create([
        'conversation_id' => $conversation->id,
        'sender_id'       => $user->id,
        'is_shop_sender'  => $this->isSellerRole($user->role) ? 1 : 0,
        'content'         => $content,
        'type'            => 'text',
        ]);
            DB::commit();

            return response()->json([
                'message' => 'Gửi tin nhắn thành công',
                'data' => $message,
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Lỗi khi gửi tin nhắn',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}

