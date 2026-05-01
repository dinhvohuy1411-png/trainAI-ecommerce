<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Message extends Model
{
    use HasFactory;
    protected $guarded = [];

    const UPDATED_AT = null; // ← thêm dòng này

    public function conversation()
    {
        return $this->belongsTo(Conversation::class);
    }
}
?>
