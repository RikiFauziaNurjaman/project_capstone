<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ItemUnitConversion extends Model
{
    protected $fillable = [
        'item_id',
        'unit_id',
        'factor',
    ];

    protected function casts(): array
    {
        return [
            'factor' => 'decimal:4',
        ];
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }
}
