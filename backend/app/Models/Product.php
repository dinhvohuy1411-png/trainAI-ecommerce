<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;
    protected $guarded = [];

    // Quan hệ: Sản phẩm thuộc về 1 Shop
    public function shop()
    {
        return $this->belongsTo(Shop::class);
    }

    // Quan hệ: Sản phẩm thuộc 1 Danh mục
    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Quan hệ: Sản phẩm có nhiều Hình ảnh (dùng để load ảnh bìa)
    // Lưu ý: Tên hàm phải là 'product_images' để khớp với code Controller cũ của bạn
    public function product_images()
    {
        return $this->hasMany(ProductImage::class);
    }

    // Quan hệ: Sản phẩm có nhiều SKU (Biến thể giá/màu)
    public function skus()
    {
        return $this->hasMany(ProductSku::class);
    }

    public function product_reviews()
    {
        return $this->hasMany(ProductReview::class, 'product_id');
    }
}