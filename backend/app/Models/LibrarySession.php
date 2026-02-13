<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class LibrarySession extends Model
{
    protected $fillable = [
        'user_id',
        'check_in_time',
        'check_out_time',
        'total_duration',
    ];

    protected $casts = [
        'check_in_time' => 'datetime',
        'check_out_time' => 'datetime',
        'total_duration' => 'integer',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
