<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_name',
        'customer_phone',
        'customer_address',
        'courier',
        'delivery_date',
        'total_price',
        'status',
    ];

    protected $casts = [
        'total_price' => 'integer',
        'delivery_date' => 'date:Y-m-d',
    ];

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }
}
