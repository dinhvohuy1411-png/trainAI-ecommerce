<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('conversations')) {
            return;
        }

        Schema::create('conversations', function (Blueprint $table) {
            $table->id();

            $table->unsignedBigInteger('user_id'); // Customer user
            $table->unsignedBigInteger('shop_id'); // Seller's shop

            $table->timestamps();

            $table->index(['user_id']);
            $table->index(['shop_id']);
            $table->unique(['user_id', 'shop_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('conversations');
    }
};

