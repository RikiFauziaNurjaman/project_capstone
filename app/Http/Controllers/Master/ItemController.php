<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreItemRequest;
use App\Http\Requests\Master\UpdateItemRequest;
use App\Models\Category;
use App\Models\Item;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class ItemController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $categoryId = trim((string) $request->string('category_id'));
        $status = trim((string) $request->string('status'));
        $stockStatus = trim((string) $request->string('stock_status'));
        $sortBy = in_array($request->string('sort_by')->toString(), ['sku', 'name', 'stock_qty', 'avg_cost', 'created_at'], true)
            ? $request->string('sort_by')->toString()
            : 'sku';
        $sortDirection = $request->string('sort_direction')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;

        $items = Item::query()
            ->with([
                'category:id,name',
                'unit:id,code,name',
                'conversions' => fn ($query) => $query->with('unit:id,code,name')->orderBy('id'),
            ])
            ->search($search)
            ->when(
                $categoryId !== '' && ctype_digit($categoryId),
                fn ($query) => $query->where('category_id', (int) $categoryId),
            )
            ->when($status === 'active', fn ($query) => $query->where('is_active', true))
            ->when($status === 'inactive', fn ($query) => $query->where('is_active', false))
            ->when($stockStatus === 'available', fn ($query) => $query->whereColumn('stock_qty', '>', 'min_stock')->where('stock_qty', '>', 0))
            ->when($stockStatus === 'low', fn ($query) => $query->lowStock())
            ->when($stockStatus === 'out', fn ($query) => $query->outOfStock())
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $statsRow = Item::query()
            ->selectRaw('COUNT(*) as total')
            ->selectRaw('SUM(CASE WHEN is_active = 1 THEN 1 ELSE 0 END) as active_count')
            ->selectRaw('SUM(CASE WHEN stock_qty > 0 AND stock_qty <= min_stock THEN 1 ELSE 0 END) as low_stock_count')
            ->selectRaw('SUM(CASE WHEN stock_qty <= 0 THEN 1 ELSE 0 END) as out_of_stock_count')
            ->first();

        return Inertia::render('master/items/index', [
            'items' => $items,
            'stats' => [
                'total' => (int) ($statsRow?->total ?? 0),
                'active' => (int) ($statsRow?->active_count ?? 0),
                'low_stock' => (int) ($statsRow?->low_stock_count ?? 0),
                'out_of_stock' => (int) ($statsRow?->out_of_stock_count ?? 0),
            ],
            'categories' => Category::query()->orderBy('name')->get(['id', 'name', 'parent_id']),
            'units' => Unit::query()->orderBy('code')->get(['id', 'code', 'name']),
            'filters' => [
                'search' => $search,
                'category_id' => $categoryId,
                'status' => $status,
                'stock_status' => $stockStatus,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(StoreItemRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $item = Item::query()->create([
                'sku' => $validated['sku'],
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'unit_id' => $validated['unit_id'],
                'stock_qty' => $validated['stock_qty'],
                'min_stock' => $validated['min_stock'],
                'avg_cost' => $validated['avg_cost'],
                'specs' => $this->normalizeSpecs($validated['specs'] ?? []),
                'is_active' => $validated['is_active'],
            ]);

            $this->syncConversions($item, $validated['conversions'] ?? []);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Barang berhasil ditambahkan.',
        ]);

        return to_route('master.items.index');
    }

    public function update(UpdateItemRequest $request, Item $item): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($item, $validated): void {
            $item->update([
                'sku' => $validated['sku'],
                'name' => $validated['name'],
                'category_id' => $validated['category_id'],
                'unit_id' => $validated['unit_id'],
                'stock_qty' => $validated['stock_qty'],
                'min_stock' => $validated['min_stock'],
                'avg_cost' => $validated['avg_cost'],
                'specs' => $this->normalizeSpecs($validated['specs'] ?? []),
                'is_active' => $validated['is_active'],
            ]);

            $this->syncConversions($item, $validated['conversions'] ?? []);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Barang berhasil diperbarui.',
        ]);

        return back();
    }

    public function destroy(Item $item): RedirectResponse
    {
        $hasTransactions = $item->stockMovements()->exists()
            || $item->goodsReceiptItems()->exists()
            || $item->goodsIssueItems()->exists()
            || $item->stockOpnameItems()->exists();

        if ($hasTransactions) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Barang tidak dapat dihapus karena sudah memiliki riwayat transaksi. Nonaktifkan barang sebagai gantinya.',
            ]);

            return back();
        }

        DB::transaction(function () use ($item): void {
            $item->conversions()->delete();
            $item->delete();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Barang berhasil dihapus.',
        ]);

        return back();
    }

    /**
     * @param  array<int, array{key: string, value: string}>  $specs
     * @return array<string, string>|null
     */
    private function normalizeSpecs(array $specs): ?array
    {
        $normalized = [];

        foreach ($specs as $entry) {
            $key = trim($entry['key']);
            $value = trim($entry['value']);

            if ($key !== '' && $value !== '') {
                $normalized[$key] = $value;
            }
        }

        return $normalized !== [] ? $normalized : null;
    }

    /**
     * @param  array<int, array{unit_id: int|string, factor: float|int|string}>  $conversions
     */
    private function syncConversions(Item $item, array $conversions): void
    {
        $item->conversions()->delete();

        $rows = [];
        foreach ($conversions as $conversion) {
            $rows[] = [
                'unit_id' => (int) $conversion['unit_id'],
                'factor' => $conversion['factor'],
            ];
        }

        if ($rows !== []) {
            $item->conversions()->createMany($rows);
        }
    }
}
