<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    // Đăng ký
    public function register(Request $request)
{
    $fields = $request->validate([
        'identifier' => 'required|string',
        'password' => 'required|string|confirmed',
    ]);
    
    $logininput = $fields['identifier'];
    
    $request->validate([
            "identifier" => 'unique:users,email',
        ], [
            "identifier.unique" => "Email đã tồn tại"
        ]);
        
    $email = $logininput;
    $phone = null;
    $name = explode('@', $logininput)[0];     
    
    $user = User::create([
        'name' => $name,
        'email' => $email,   
        'phone' => $phone,   
        'password' => Hash::make($fields['password']),
        'role' => 'user'
    ]);

    $token = $user->createToken('myapptoken')->plainTextToken;

    return response()->json([
        'user' => $user,
        'token' => $token
    ], 201);
}

    // Đăng nhập
    public function login(Request $request)
    {
        $fields = $request->validate([
            'identifier' => 'required|string',
            'password' => 'required|string'
        ]);
        $logininput=$fields['identifier'];
    
        if (filter_var($logininput, FILTER_VALIDATE_EMAIL)) {
            $user = User::where('email', $logininput)->first();
        } else {
            $user = User::where('phone', $logininput)->first();
        }

        if (!$user || !Hash::check($fields['password'], $user->password)) {
            return response()->json([
                'message' => 'Thông tin đăng nhập không đúng'
            ], 401);
        }

        $token = $user->createToken('myapptoken')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role, 
            ],
            'message' => 'Đăng nhập thành công'
        ], 200);
    }

    // Đăng xuất
    public function logout(Request $request)
    {
        /** @var \App\Models\User $user */
        $user = $request->user();
        $user->tokens()->delete();

        return response()->json(['message' => 'Đăng xuất thành công']);
    }
}