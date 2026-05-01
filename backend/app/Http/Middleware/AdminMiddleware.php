<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class AdminMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthorized. Admin only.'
            ], 403);
        }

        // Support multiple roles separated by comma
        $roles = array_map('trim', explode(',', $user->role));
        $isAdmin = in_array('admin', $roles) || $user->role === 'admin';

        if (!$isAdmin) {
            return response()->json([
                'message' => 'Unauthorized. Admin only.'
            ], 403);
        }

        return $next($request);
    }
}