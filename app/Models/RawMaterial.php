<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class RawMaterial extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'stock',
        'unit',
        'low_stock_threshold',
    ];

    protected $casts = [
        'stock' => 'float',
        'low_stock_threshold' => 'float',
    ];
}
