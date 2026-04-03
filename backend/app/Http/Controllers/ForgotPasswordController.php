<?php
namespace App\Http\Controllers;
use Illuminate\Http\Request;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use App\Mail\SendOtpMail;

class ForgotPasswordController extends Controller
{
    public function forgotPassword(Request $request)
{
    $fields = $request->validate([
        'email' => 'required|email',
    ]);

    $user = User::where('email', $fields['email'])->first();
    if (!$user) {
        return response()->json([
            'message' => 'Không tìm thấy người dùng'
        ], 404);
    }
    $name = $user->name;
    $maskedName = substr($name, 0, 1) 
            . str_repeat('*', strlen($name) - 2) 
            . substr($name, -1);
    $otp = rand(100000, 999999);
    DB::table('password_resets_new')->updateOrInsert(
        ['email' => $user->email],
        [
            'otp' => $otp,
            'expires_at' => Carbon::now()->addMinutes(10)
        ]
    );
    Mail::to($user->email)->send(new SendOtpMail($maskedName,$otp));

    return response()->json([
        'message' => 'OTP đã gửi tới email',
        'otp' => $otp
    ]);
}
public function verifyOtp(Request $request)
{
    $fields = $request->validate([
        'email'=>'required',
        'otp'=>'required'
    ]);

    $record = DB::table('password_resets_new')
        ->where('email',$fields['email'])
        ->where('otp',$fields['otp'])
        ->first();

    if(!$record){
        return response()->json(['message'=>'OTP không tồn tại'],404);
    }

    if($record->otp != $fields['otp']){
        return response()->json(['message'=>'OTP sai'],400);
    }

    if(now()->gt($record->expires_at)){
        return response()->json(['message'=>'OTP hết hạn'],400);
    }
    $token = Str::random(60);
    DB::table('password_resets_new')
        ->where('email', $fields['email'])
        ->update(['reset_tokens' => $token]);
    return response()->json([
        'token' => $token
    ]);
}
public function resetPassword(Request $request)
{
    $fields = $request->validate([
        'email' => 'required|email',
        'token' => 'required',
        'password' => 'required|confirmed|min:6'
    ]);

    $record = DB::table('password_resets_new')
        ->where('email', $fields['email'])
        ->where('reset_tokens', $fields['token'])
        ->first();
    if (!$record) {
        return response()->json([
            'message' => 'Token không hợp lệ'
        ], 400);
    }
    $user = User::where('email', $fields['email'])->first();

    if (!$user) {
        return response()->json([
            'message' => 'User không tồn tại'
        ], 404);
    }

    $user->password = Hash::make($fields['password']);
    $user->save();

    DB::table('password_resets_new')
        ->where('email', $fields['email'])
        ->delete();

    return response()->json([
        'message' => 'Đổi mật khẩu thành công'
    ]);
}
}