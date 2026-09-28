<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->string('customer_name');
            $table->string('customer_phone');
            $table->text('customer_address');
            $table->string('courier'); // 'Instant', 'Sameday', 'Ekspedisi'
            $table->date('delivery_date'); // date requested for delivery (supports PO)
            $table->integer('total_price');
            $table->string('status')->default('Pending'); // 'Pending', 'Kitchen Queue', 'Ready for Delivery', 'Completed'
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
