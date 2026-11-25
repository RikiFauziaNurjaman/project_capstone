<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GoodsIssueItem extends Model
{
    protected $fillable = [
        'goods_issue_id',
        'item_id',
        'qty',
    ];

    protected function casts(): array
    {
        return [
            'qty' => 'decimal:3',
        ];
    }

    public function goodsIssue()
    {
        return $this->belongsTo(GoodsIssue::class);
    }

    public function item()
    {
        return $this->belongsTo(Item::class);
    }
}
