<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductSku extends Model
{
    use HasFactory;
    protected $guarded = [];
    public $timestamps = false;
    public function product()
    {
        return $this->belongsTo(Product::class);
    }
    public function attributeValues()
    {
        return $this->belongsToMany(
            ProductAttributeValue::class, 
            'sku_values', 
            'product_sku_id', 
            'product_attribute_value_id'
        );
    }
}