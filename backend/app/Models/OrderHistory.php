<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderHistory extends Model
{
    use HasFactory;

    // Bảng này trong DB của bạn không có cột updated_at
    public $timestamps = false; 
    

    protected $guarded = [];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }


    public function performedBy()
    {
        return $this->belongsTo(User::class, 'performed_by');
    }
}


