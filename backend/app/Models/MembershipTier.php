<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class MembershipTier extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 
        'min_spent', 
        'discount_percent', 
        'free_shipping_quota', 
        'custom_benefits', 
        'is_active'
    ];

    // Cực kỳ quan trọng: Ép kiểu dữ liệu tự động
    protected $casts = [
        'custom_benefits' => 'array', // Trả về array thay vì string JSON
        'is_active' => 'boolean',     // Trả về true/false thay vì 1/0
        'min_spent' => 'decimal:2',
        'discount_percent' => 'decimal:2',
    ];

    // Một hạng có thể có nhiều User
    public function userMemberships()
    {
        return $this->hasMany(UserMembership::class, 'tier_id');
    }
}