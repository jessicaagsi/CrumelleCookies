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
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->integer('price');
            $table->string('category'); // e.g. 'The Classics', 'Premium Gourmet', 'Seasonal'
            $table->string('photo'); // filename or url path
            $table->integer('stock');
            $table->string('status')->default('Active'); // 'Active' or 'Draft'
            $table->text('description')->nullable();
            $table->string('weight')->nullable(); // e.g. 'Big Cookie (diameter 8cm)', 'Mini Bites (150gr)'
            $table->string('shelf_life')->nullable(); // e.g. '7 hari suhu ruang'
            $table->string('serving_suggestion')->nullable(); // e.g. 'Microwave selama 10 detik'
            $table->text('ingredients')->nullable(); // JSON or comma-separated list of allergens/ingredients
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
