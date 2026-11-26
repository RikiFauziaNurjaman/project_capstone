<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreCategoryRequest;
use App\Http\Requests\Master\UpdateCategoryRequest;
use App\Models\Category;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class CategoryController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $parentFilter = trim((string) $request->string('parent_id'));
        $sortBy = in_array($request->string('sort_by')->toString(), ['name', 'created_at'], true)
            ? $request->string('sort_by')->toString()
            : 'name';
        $sortDirection = $request->string('sort_direction')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;

        $categories = Category::query()
            ->with('parent:id,name')
            ->withCount(['items', 'children'])
            ->search($search)
            ->when($parentFilter === 'root', fn ($query) => $query->whereNull('parent_id'))
            ->when(
                $parentFilter !== '' && $parentFilter !== 'root' && ctype_digit($parentFilter),
                fn ($query) => $query->where('parent_id', (int) $parentFilter),
            )
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $parentOptions = Category::query()
            ->orderBy('name')
            ->get(['id', 'name', 'parent_id']);

        return Inertia::render('master/categories/index', [
            'categories' => $categories,
            'parentOptions' => $parentOptions,
            'filters' => [
                'search' => $search,
                'parent_id' => $parentFilter,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(StoreCategoryRequest $request): RedirectResponse
    {
        Category::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kategori berhasil ditambahkan.',
        ]);

        return to_route('master.categories.index');
    }

    public function update(UpdateCategoryRequest $request, Category $category): RedirectResponse
    {
        $category->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kategori berhasil diperbarui.',
        ]);

        return back();
    }

    public function destroy(Category $category): RedirectResponse
    {
        if ($category->items()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Kategori tidak dapat dihapus karena masih digunakan oleh data barang.',
            ]);

            return back();
        }

        $category->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Kategori berhasil dihapus.',
        ]);

        return back();
    }
}
