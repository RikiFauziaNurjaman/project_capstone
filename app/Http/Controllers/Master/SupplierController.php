<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreSupplierRequest;
use App\Http\Requests\Master\UpdateSupplierRequest;
use App\Models\Supplier;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class SupplierController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $sortBy = in_array($request->string('sort_by')->toString(), ['name', 'phone', 'created_at'], true)
            ? $request->string('sort_by')->toString()
            : 'name';
        $sortDirection = $request->string('sort_direction')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;

        $suppliers = Supplier::query()
            ->withCount('goodsReceipts')
            ->search($search)
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('master/suppliers/index', [
            'suppliers' => $suppliers,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(StoreSupplierRequest $request): RedirectResponse
    {
        Supplier::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier berhasil ditambahkan.',
        ]);

        return to_route('master.suppliers.index');
    }

    public function update(UpdateSupplierRequest $request, Supplier $supplier): RedirectResponse
    {
        $supplier->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier berhasil diperbarui.',
        ]);

        return back();
    }

    public function destroy(Supplier $supplier): RedirectResponse
    {
        if ($supplier->goodsReceipts()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Supplier tidak dapat dihapus karena masih memiliki riwayat penerimaan barang.',
            ]);

            return back();
        }

        $supplier->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Supplier berhasil dihapus.',
        ]);

        return back();
    }
}
