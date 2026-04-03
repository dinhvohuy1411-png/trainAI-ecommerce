<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('order_histories')) {
            return;
        }

        Schema::create('order_histories', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('order_id');
            $table->string('from_status')->nullable();
            $table->string('to_status');
            $table->unsignedBigInteger('performed_by')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            $table->index(['order_id']);
            $table->index(['performed_by']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_histories');
    }
};

