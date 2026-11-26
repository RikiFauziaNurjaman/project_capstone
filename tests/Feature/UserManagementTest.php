<?php

use App\Models\User;
use Database\Seeders\RolePermissionSeeder;
use Spatie\Permission\Models\Role;

beforeEach(function () {
    $this->seed(RolePermissionSeeder::class);
});

test('non-admin users without user management permission cannot access user management', function () {
    $staff = User::factory()->create(['role' => 'gudang']);
    $staff->syncRoles(['gudang']);

    $this->actingAs($staff)
        ->get(route('users.index'))
        ->assertForbidden();

    $this->actingAs($staff)
        ->get(route('roles.index'))
        ->assertForbidden();
});

test('admin can create, update, and delete users with spatie roles', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $admin->syncRoles(['admin']);

    $this->actingAs($admin)
        ->post(route('users.store'), [
            'name' => 'Budi Gudang',
            'email' => 'budi@mks.co.id',
            'password' => 'rahasia123',
            'password_confirmation' => 'rahasia123',
            'role' => 'gudang',
            'email_verified' => true,
        ])
        ->assertRedirect(route('users.index'));

    $created = User::query()->where('email', 'budi@mks.co.id')->firstOrFail();
    expect($created->hasRole('gudang'))->toBeTrue();
    expect($created->email_verified_at)->not->toBeNull();

    $this->actingAs($admin)
        ->put(route('users.update', $created), [
            'name' => 'Budi Pimpinan',
            'email' => 'budi@mks.co.id',
            'role' => 'pimpinan',
            'email_verified' => true,
        ])
        ->assertRedirect();

    expect($created->fresh()->hasRole('pimpinan'))->toBeTrue();

    // Admin cannot delete themselves
    $this->actingAs($admin)
        ->delete(route('users.destroy', $admin))
        ->assertRedirect();
    expect(User::query()->whereKey($admin->id)->exists())->toBeTrue();

    // Admin can delete other user without transactions
    $this->actingAs($admin)
        ->delete(route('users.destroy', $created))
        ->assertRedirect();
    expect(User::query()->whereKey($created->id)->exists())->toBeFalse();
});

test('admin can create custom role with permissions and cannot delete core roles', function () {
    $admin = User::factory()->create(['role' => 'admin']);
    $admin->syncRoles(['admin']);

    $this->actingAs($admin)
        ->post(route('roles.store'), [
            'name' => 'supervisor',
            'permissions' => ['dashboard.view', 'master.items.view', 'reports.view'],
        ])
        ->assertRedirect(route('roles.index'));

    $supervisor = Role::query()->where('name', 'supervisor')->firstOrFail();
    expect($supervisor->hasPermissionTo('reports.view'))->toBeTrue();

    // Core role cannot be deleted
    $coreRole = Role::query()->where('name', 'gudang')->firstOrFail();
    $this->actingAs($admin)
        ->delete(route('roles.destroy', $coreRole))
        ->assertRedirect();
    expect(Role::query()->whereKey($coreRole->id)->exists())->toBeTrue();

    // Custom unused role can be deleted
    $this->actingAs($admin)
        ->delete(route('roles.destroy', $supervisor))
        ->assertRedirect();
    expect(Role::query()->whereKey($supervisor->id)->exists())->toBeFalse();
});
