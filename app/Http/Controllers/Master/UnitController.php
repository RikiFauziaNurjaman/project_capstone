<?php

namespace App\Http\Controllers\Master;

use App\Http\Controllers\Controller;
use App\Http\Requests\Master\StoreUnitRequest;
use App\Http\Requests\Master\UpdateUnitRequest;
use App\Models\Unit;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class UnitController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $sortBy = in_array($request->string('sort_by')->toString(), ['code', 'name', 'created_at'], true)
            ? $request->string('sort_by')->toString()
            : 'code';
        $sortDirection = $request->string('sort_direction')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;

        $units = Unit::query()
            ->withCount(['items', 'conversions'])
            ->search($search)
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        return Inertia::render('master/units/index', [
            'units' => $units,
            'filters' => [
                'search' => $search,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(StoreUnitRequest $request): RedirectResponse
    {
        Unit::query()->create($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Satuan berhasil ditambahkan.',
        ]);

        return to_route('master.units.index');
    }

    public function update(UpdateUnitRequest $request, Unit $unit): RedirectResponse
    {
        $unit->update($request->validated());

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Satuan berhasil diperbarui.',
        ]);

        return back();
    }

    public function destroy(Unit $unit): RedirectResponse
    {
        if ($unit->items()->exists() || $unit->conversions()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Satuan tidak dapat dihapus karena masih digunakan oleh barang atau konversi satuan.',
            ]);

            return back();
        }

        $unit->delete();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Satuan berhasil dihapus.',
        ]);

        return back();
    }
}
