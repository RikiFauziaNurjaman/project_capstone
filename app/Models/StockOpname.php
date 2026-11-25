<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockOpname extends Model
{
    protected $fillable = [
        'number',
        'opname_date',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'opname_date' => 'date',
        ];
    }

    public function user()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(StockOpnameItem::class);
    }
}
