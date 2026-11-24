<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class StockMovement extends Model
{
    protected $fillable = [
        'item_id',
        'type',
        'qty',
        'qty_after',
        'unit_cost',
        'reference_type',
        'reference_id',
        'moved_at',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
            'qty_after' => 'decimal:3',
            'unit_cost' => 'decimal:2',
            'moved_at' => 'datetime',
        ];
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function reference()
    {
        return $this->morphTo();
    }
}
