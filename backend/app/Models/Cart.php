<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
class Cart extends Model
{
    use HasFactory;
    protected $guarded = [];

   public function items()
{
    return $this->hasMany(CartItem::class, 'cart_id');
}
public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }
}