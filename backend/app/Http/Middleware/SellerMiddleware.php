<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class SellerMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $role = $user->role;
        // Support multiple roles separated by comma (e.g., "user,seller" or just "seller")
        $roles = array_map('trim', explode(',', $role));
        $isSeller = in_array('seller', $roles) || $role === 'seller' || $role === 2 || $role === '2';

        if (!$isSeller) {
            return response()->json(['message' => 'Unauthorized. Seller only.'], 403);
        }

        return $next($request);
    }
}

