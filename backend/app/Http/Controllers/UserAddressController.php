<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\UserAddress;

class UserAddressController extends Controller
{
    public function index()
    {
        $addresses = UserAddress::where('user_id', auth()->id())
                    ->orderBy('is_default', 'desc')
                    ->orderBy('created_at', 'desc')
                    ->get();
        return response()->json($addresses);
    }

    public function store(Request $request)
    {
        $request->validate([
            'recipient_name' => 'required|string',
            'recipient_phone' => 'required|string',
            'address_detail' => 'required|string',
            'city' => 'required|string',
            'district' => 'nullable|string',
            'ward' => 'nullable|string',
        ]);

        $user = Auth::user();

        $isFirst = UserAddress::where('user_id', $user->id)->doesntExist();

        $address = UserAddress::create([
            'user_id' => $user->id,
            'recipient_name' => $request->recipient_name,
            'recipient_phone' => $request->recipient_phone,
            'address_detail' => $request->address_detail,
            'city' => $request->city,
            'district' => $request->district,
            'ward' => $request->ward,
            'is_default' => $isFirst ? 1 : 0
        ]);
        $user->phone=$request->recipient_phone;
        $user->save();
        return response()->json(['message' => 'Thêm địa chỉ thành công', 'data' => $address]);
    }
    public function update(Request $request, $id)
    {
        $request->validate([
            'recipient_name'  => 'required|string',
            'recipient_phone' => 'required|string',
            'address_detail'  => 'required|string',
            'city'            => 'required|string',
            'district'        => 'nullable|string',
            'ward'            => 'nullable|string',
        ]);

        $user = Auth::user();

        $address = UserAddress::where('user_id', $user->id)->findOrFail($id);

        $address->update([
            'recipient_name'  => $request->recipient_name,
            'recipient_phone' => $request->recipient_phone,
            'address_detail'  => $request->address_detail,
            'city'            => $request->city,
            'district'        => $request->district,
            'ward'            => $request->ward,
        ]);

        return response()->json([
            'message' => 'Cập nhật địa chỉ thành công', 
            'data' => $address
        ]);
    }

    public function destroy($id)
    {
        $user = Auth::user();

        $address = UserAddress::where('user_id', $user->id)->findOrFail($id);

        $address->delete();

        return response()->json(['message' => 'Xóa địa chỉ thành công']);
    }

    public function setDefault($id)
    {
        $user = Auth::user();

        $address = UserAddress::where('user_id', $user->id)->findOrFail($id);

        UserAddress::where('user_id', $user->id)->update(['is_default' => 0]);

        $address->update(['is_default' => 1]);

        return response()->json(['message' => 'Đã thiết lập địa chỉ mặc định']);
    }
}