<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Shop; 

class AdminShopController extends Controller
{
    // Lấy shop chưa duyệt
    public function index()
    {
        return Shop::where('is_verified', 0)->get();
    }

    // Duyệt shop
    public function approve($id)
    {
        $user = auth()->user();
        $shop = Shop::findOrFail($id);
        $shop->is_verified = 1;
        $shop->save();
        $user->role = 'seller';
        $user->save();
        return response()->json([
            'message' => 'Shop đã được duyệt'
        ]);
    }
}