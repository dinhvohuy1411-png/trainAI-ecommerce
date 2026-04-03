<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PaymentMethod extends Model
{
    use HasFactory;
    
    // Bảng này không có created_at, updated_at
    public $timestamps = false;
    
    protected $guarded = [];
}