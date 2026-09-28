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
        Schema::create('raw_materials', function (Blueprint $table) {
            $table->id();
            $table->string('name'); // e.g. Butter, Choco Chunks, Flour, Eggs, Crumelle Box
            $table->decimal('stock', 8, 2); // quantities
            $table->string('unit'); // e.g. 'kg', 'pcs', 'butir'
            $table->decimal('low_stock_threshold', 8, 2); // threshold for alerts
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('raw_materials');
    }
};
