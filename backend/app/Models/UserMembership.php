<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class UserMembership extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 
        'tier_id', 
        'total_spent'
    ];

    protected $casts = [
        'total_spent' => 'decimal:2',
    ];

    // Thuộc về 1 User
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Thuộc về 1 Hạng Thành Viên
    public function tier()
    {
        return $this->belongsTo(MembershipTier::class, 'tier_id');
    }
}