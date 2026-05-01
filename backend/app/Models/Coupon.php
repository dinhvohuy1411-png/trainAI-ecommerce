<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Coupon extends Model
{
    use HasFactory;

    protected $fillable = [
        'shop_id', 
        'code', 
        'discount_type',   
        'membership_tier_id',   
        'discount_value', 
        'min_order_value', 
        'max_discount_value', 
        'start_date', 
        'end_date', 
        'usage_limit'        
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
        'discount_value' => 'float',
        'min_order_value' => 'float',
        'max_discount_value' => 'float',
        'usage_limit' => 'integer',
    ];

    
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    
    public function isValid()
    {
        $now = Carbon::now();
        
        
        if ($now->lt($this->start_date) || $now->gt($this->end_date)) {
            return false;
        }

        
        if ($this->usage_limit <= 0) {
            return false;
        }

        return true;
    }
    // Hàm giảm số lượng mã khi có người dùng thành công
    public function decrementUsage()
    {
        if ($this->usage_limit > 0) {
            $this->decrement('usage_limit');
        }
    }
    public function tier()
{
    return $this->belongsTo(MembershipTier::class, 'membership_tier_id');
}
}