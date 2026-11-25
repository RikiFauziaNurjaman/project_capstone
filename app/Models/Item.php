<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Item extends Model
{
    protected $fillable = [
        'sku',
        'name',
        'category_id',
        'unit_id',
        'stock_qty',
        'min_stock',
        'avg_cost',
        'specs',
        'is_active',
    ];

    protected $casts = [
        'specs' => 'array',
        'is_active' => 'boolean',
        'stock_qty' => 'decimal:3',
        'min_stock' => 'decimal:3',
        'avg_cost' => 'decimal:2',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function unit()
    {
        return $this->belongsTo(Unit::class);
    }


public function conversions()
{
    return $this->hasMany(ItemUnitConversion::class);
}

public function stockMovements()
{
    return $this->hasMany(StockMovement::class);
}

public function goodsReceiptItems()
{
    return $this->hasMany(GoodsReceiptItem::class);
}

public function goodsIssueItems()
{
    return $this->hasMany(GoodsIssueItem::class);
}

public function stockOpnameItems()
{
    return $this->hasMany(StockOpnameItem::class);
}

}