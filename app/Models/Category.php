<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Attributes\Scope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'parent_id',
    ];

    /**
     * @return HasMany<Item, $this>
     */
    public function items(): HasMany
    {
        return $this->hasMany(Item::class);
    }

    /**
     * @return BelongsTo<Category, $this>
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'parent_id');
    }

    /**
     * @return HasMany<Category, $this>
     */
    public function children(): HasMany
    {
        return $this->hasMany(Category::class, 'parent_id');
    }

    /**
     * @param  Builder<Category>  $query
     * @return Builder<Category>
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
                ->where('name', 'like', "%{$keyword}%")
                ->orWhereHas('parent', function (Builder $parentQuery) use ($keyword): void {
                    $parentQuery->where('name', 'like', "%{$keyword}%");
                });
        });
    }

    /**
     * Check whether the given category ID is a descendant of this category.
     */
    public function hasDescendant(int $categoryId): bool
    {
        $childIds = $this->children()->pluck('id');

        if ($childIds->contains($categoryId)) {
            return true;
        }

        foreach ($this->children as $child) {
            if ($child->hasDescendant($categoryId)) {
                return true;
            }
        }

        return false;
    }
}
