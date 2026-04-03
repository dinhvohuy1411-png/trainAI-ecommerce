<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;
    protected $guarded = [];
    public $timestamps = false; // Bảng này thường không cần timestamps

    public function sku()
    {
        return $this->belongsTo(ProductSku::class, 'product_sku_id');
    }
    public function product()
{
    return $this->belongsTo(Product::class);
}
}