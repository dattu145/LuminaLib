<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AuditLog extends Model
{
    protected $fillable = [
        'action_type',
        'performed_by',
        'target_id',
        'description',
    ];
}
