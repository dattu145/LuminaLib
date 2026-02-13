<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Book extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'author',
        'publisher',
        'category',
        'isbn',
        'book_code',
        'total_copies',
        'available_copies',
        'rack_number',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
