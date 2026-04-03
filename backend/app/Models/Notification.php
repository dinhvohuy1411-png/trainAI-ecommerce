<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Notification extends Model
{
    use HasFactory;
    
    public $timestamps = false; // DB của bạn chỉ có created_at, không có updated_at
    protected $guarded = [];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}