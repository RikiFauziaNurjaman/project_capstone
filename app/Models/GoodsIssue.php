<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoodsIssue extends Model
{
    protected $fillable = [
        'number',
        'issued_date',
        'purpose',
        'job_reference',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'issued_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(GoodsIssueItem::class);
    }
}
