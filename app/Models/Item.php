<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Item extends Model
{
    /**
     * @var list<string>
     */
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

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'specs' => 'array',
            'is_active' => 'boolean',
            'stock_qty' => 'decimal:3',
            'min_stock' => 'decimal:3',
            'avg_cost' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    /**
     * @return BelongsTo<Unit, $this>
     */
    public function unit(): BelongsTo
    {
        return $this->belongsTo(Unit::class);
    }

    /**
     * @return HasMany<ItemUnitConversion, $this>
     */
    public function conversions(): HasMany
    {
        return $this->hasMany(ItemUnitConversion::class);
    }

    /**
     * @return HasMany<StockMovement, $this>
     */
    public function stockMovements(): HasMany
    {
        return $this->hasMany(StockMovement::class);
    }

    /**
     * @return HasMany<GoodsReceiptItem, $this>
     */
    public function goodsReceiptItems(): HasMany
    {
        return $this->hasMany(GoodsReceiptItem::class);
    }

    /**
     * @return HasMany<GoodsIssueItem, $this>
     */
    public function goodsIssueItems(): HasMany
    {
        return $this->hasMany(GoodsIssueItem::class);
    }

    /**
     * @return HasMany<StockOpnameItem, $this>
     */
    public function stockOpnameItems(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class);
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    #[Scope]
    protected function search(Builder $query, ?string $term): Builder
    {
        $keyword = trim((string) $term);

        if ($keyword === '') {
            return $query;
        }

        return $query->where(function (Builder $builder) use ($keyword): void {
            $builder
                ->where('sku', 'like', "%{$keyword}%")
                ->orWhere('name', 'like', "%{$keyword}%")
                ->orWhereHas('category', function (Builder $categoryQuery) use ($keyword): void {
                    $categoryQuery->where('name', 'like', "%{$keyword}%");
                });
        });
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    #[Scope]
    protected function active(Builder $query): Builder
    {
        return $query->where('is_active', true);
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    #[Scope]
    protected function lowStock(Builder $query): Builder
    {
        return $query
            ->where('stock_qty', '>', 0)
            ->whereColumn('stock_qty', '<=', 'min_stock');
    }

    /**
     * @param  Builder<Item>  $query
     * @return Builder<Item>
     */
    #[Scope]
    protected function outOfStock(Builder $query): Builder
    {
        return $query->where('stock_qty', '<=', 0);
    }
}
