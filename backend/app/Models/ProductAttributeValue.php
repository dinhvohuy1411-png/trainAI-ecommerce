<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ProductAttributeValue extends Model
{
    public $timestamps = false;
    protected $fillable = ['product_id', 'attribute_id', 'value'];

    // Nối ngược lại bảng attributes để lấy tên (Màu sắc, Kích cỡ...)
    public function attribute()
    {
        return $this->belongsTo(Attribute::class);
    }

    // Mối quan hệ Nhiều-Nhiều với bảng product_skus thông qua bảng trung gian sku_values
    public function skus()
    {
        return $this->belongsToMany(ProductSku::class, 'sku_values', 'product_attribute_value_id', 'product_sku_id');
    }
}