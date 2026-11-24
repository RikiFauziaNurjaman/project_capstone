<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Unit extends Model
{
    protected $fillable = [
        'code',
        'name',
    ];

    public function items()
    {
        return $this->hasMany(Item::class);
    }

    public function conversions()
    {
        return $this->hasMany(ItemUnitConversion::class);
    }
}
