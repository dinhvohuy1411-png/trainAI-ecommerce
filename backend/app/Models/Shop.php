<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Shop extends Model
{
    use HasFactory;
    protected $guarded = []; // Cho phép điền mọi cột (nhanh gọn)

    // Quan hệ: 1 Shop thuộc về 1 User (chủ shop)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Alias để dễ sử dụng
    public function owner()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    // Quan hệ: 1 Shop có nhiều Sản phẩm
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}