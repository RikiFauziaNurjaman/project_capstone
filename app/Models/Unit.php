<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Unit extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'code',
        'name',
    ];

    /**
     * @return HasMany<Item, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    /**
     * @return HasMany<ItemUnitConversion, $this>
     */
    public function conversions(): HasMany
    {
        return $this->hasMany(ItemUnitConversion::class);
    }

    /**
     * @param  Builder<Unit>  $query
     * @return Builder<Unit>
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
                ->where('code', 'like', "%{$keyword}%")
                ->orWhere('name', 'like', "%{$keyword}%");
        });
    }
}
