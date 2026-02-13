<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class FinesConfig extends Model
{
    protected $fillable = [
        'fine_per_day',
        'max_fine_limit',
        'grace_days',
    ];

    protected $casts = [
        'fine_per_day' => 'decimal:2',
        'max_fine_limit' => 'decimal:2',
    ];
}
