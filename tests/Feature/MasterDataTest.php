<?php

use App\Models\Category;
use App\Models\Item;
use App\Models\Supplier;
use App\Models\Unit;
use App\Models\User;
use Inertia\Testing\AssertableInertia as Assert;

test('guests are redirected to login for master data routes', function (string $routeName) {
    $this->get(route($routeName))->assertRedirect(route('login'));
})->with([
    'items' => 'master.items.index',
    'categories' => 'master.categories.index',
    'units' => 'master.units.index',
    'suppliers' => 'master.suppliers.index',
]);

test('authenticated users can manage units and cannot delete units in use', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->post(route('master.units.store'), [
        'code' => 'pcs',
        'name' => 'Pieces',
    ])->assertRedirect(route('master.units.index'));

    $unit = Unit::query()->where('code', 'PCS')->first();
    expect($unit)->not->toBeNull();
    expect($unit->name)->toBe('Pieces');

    $this->post(route('master.units.store'), [
        'code' => 'PCS',
        'name' => 'Duplicate',
    ])->assertSessionHasErrors('code');

    $this->put(route('master.units.update', $unit), [
        'code' => 'buah',
        'name' => 'Buah',
    ])->assertRedirect();

    expect($unit->fresh()->code)->toBe('BUAH');

    $category = Category::query()->create(['name' => 'Material']);
    Item::query()->create([
        'sku' => 'SKU-001',
        'name' => 'Akrilik',
        'category_id' => $category->id,
        'unit_id' => $unit->id,
    ]);

    $this->delete(route('master.units.destroy', $unit))->assertRedirect();
    expect(Unit::query()->whereKey($unit->id)->exists())->toBeTrue();

    $unusedUnit = Unit::query()->create(['code' => 'ROLL', 'name' => 'Roll']);
    $this->delete(route('master.units.destroy', $unusedUnit))->assertRedirect();
    expect(Unit::query()->whereKey($unusedUnit->id)->exists())->toBeFalse();
});

test('authenticated users can manage categories and circular hierarchy is rejected', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->post(route('master.categories.store'), [
        'name' => 'Material Utama',
        'parent_id' => null,
    ])->assertRedirect(route('master.categories.index'));

    $parent = Category::query()->where('name', 'Material Utama')->firstOrFail();

    $this->post(route('master.categories.store'), [
        'name' => 'Akrilik',
        'parent_id' => $parent->id,
    ])->assertRedirect(route('master.categories.index'));

    $child = Category::query()->where('name', 'Akrilik')->firstOrFail();
    expect($child->parent_id)->toBe($parent->id);

    $this->put(route('master.categories.update', $parent), [
        'name' => 'Material Utama',
        'parent_id' => $child->id,
    ])->assertSessionHasErrors('parent_id');

    $this->delete(route('master.categories.destroy', $child))->assertRedirect();
    expect(Category::query()->whereKey($child->id)->exists())->toBeFalse();
});

test('authenticated users can manage suppliers', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $this->post(route('master.suppliers.store'), [
        'name' => 'PT. Sumber Akrilik',
        'phone' => '081234567890',
        'address' => 'Surabaya',
    ])->assertRedirect(route('master.suppliers.index'));

    $supplier = Supplier::query()->where('name', 'PT. Sumber Akrilik')->firstOrFail();

    $this->put(route('master.suppliers.update', $supplier), [
        'name' => 'PT. Sumber Akrilik Jaya',
        'phone' => '081299998888',
        'address' => 'Sidoarjo',
    ])->assertRedirect();

    expect($supplier->fresh()->name)->toBe('PT. Sumber Akrilik Jaya');

    $this->delete(route('master.suppliers.destroy', $supplier))->assertRedirect();
    expect(Supplier::query()->whereKey($supplier->id)->exists())->toBeFalse();
});

test('authenticated users can manage items with specs and unit conversions', function () {
    $user = User::factory()->create();
    $this->actingAs($user);

    $category = Category::query()->create(['name' => 'Kelistrikan']);
    $pcs = Unit::query()->create(['code' => 'PCS', 'name' => 'Pieces']);
    $box = Unit::query()->create(['code' => 'BOX', 'name' => 'Box']);

    $this->post(route('master.items.store'), [
        'sku' => 'led-001',
        'name' => 'LED Module 12V',
        'category_id' => $category->id,
        'unit_id' => $pcs->id,
        'stock_qty' => 250,
        'min_stock' => 50,
        'avg_cost' => 3500,
        'is_active' => true,
        'specs' => [
            ['key' => 'Tegangan', 'value' => '12V'],
            ['key' => 'Warna', 'value' => 'Putih'],
        ],
        'conversions' => [
            ['unit_id' => $box->id, 'factor' => 100],
        ],
    ])->assertRedirect(route('master.items.index'));

    $item = Item::query()->with('conversions')->where('sku', 'LED-001')->firstOrFail();
    expect($item->specs)->toBe(['Tegangan' => '12V', 'Warna' => 'Putih']);
    expect($item->conversions)->toHaveCount(1);
    expect((float) $item->conversions->first()->factor)->toBe(100.0);

    // Reject conversion using the same unit as base unit
    $this->put(route('master.items.update', $item), [
        'sku' => 'LED-001',
        'name' => 'LED Module 12V',
        'category_id' => $category->id,
        'unit_id' => $pcs->id,
        'stock_qty' => 250,
        'min_stock' => 50,
        'avg_cost' => 3500,
        'is_active' => true,
        'conversions' => [
            ['unit_id' => $pcs->id, 'factor' => 10],
        ],
    ])->assertSessionHasErrors('conversions.0.unit_id');

    $this->get(route('master.items.index', ['search' => 'LED-001']))
        ->assertOk()
        ->assertInertia(fn (Assert $page) => $page
            ->component('master/items/index')
            ->has('items.data', 1)
            ->where('stats.total', 1),
        );

    $this->delete(route('master.items.destroy', $item))->assertRedirect();
    expect(Item::query()->whereKey($item->id)->exists())->toBeFalse();
});
