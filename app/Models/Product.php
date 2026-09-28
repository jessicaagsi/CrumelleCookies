<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'price',
        'category',
        'photo',
        'stock',
        'status',
        'description',
        'weight',
        'shelf_life',
        'serving_suggestion',
        'ingredients',
    ];

    protected $casts = [
        'price' => 'integer',
        'stock' => 'integer',
        'ingredients' => 'array',
    ];

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
