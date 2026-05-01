<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class UserMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();
        if (!$user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $role = $user->role;
        // Support multiple roles separated by comma (e.g., "user,seller" or just "user")
        $roles = array_map('trim', explode(',', $role));
        $isUser = in_array('user', $roles) || $role === 'user' || $role === 1 || $role === '1';

        if (!$isUser) {
            return response()->json(['message' => 'Unauthorized. User only.'], 403);
        }

        return $next($request);
    }
}

