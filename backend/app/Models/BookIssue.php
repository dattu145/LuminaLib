<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BookIssue extends Model
{
    protected $fillable = [
        'book_id',
        'user_id',
        'issued_date',
        'due_date',
        'returned_date',
        'fine_amount',
        'fine_paid',
        'status',
    ];

    protected $casts = [
        'issued_date' => 'datetime',
        'due_date' => 'datetime',
        'returned_date' => 'datetime',
        'fine_amount' => 'decimal:2',
        'fine_paid' => 'boolean',
    ];

    public function book()
    {
        return $this->belongsTo(Book::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
