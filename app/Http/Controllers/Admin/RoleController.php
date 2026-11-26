<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreRoleRequest;
use App\Http\Requests\Admin\UpdateRoleRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RoleController extends Controller
{
    /**
     * @var list<string>
     */
    private const array CORE_ROLES = ['admin', 'gudang', 'pimpinan'];

    public function index(): Response
    {
        $roles = Role::query()
            ->where('guard_name', 'web')
            ->with('permissions:id,name')
            ->withCount('users')
            ->orderBy('name')
            ->get(['id', 'name', 'guard_name', 'created_at']);

        $permissions = Permission::query()
            ->where('guard_name', 'web')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('users/roles', [
            'roles' => $roles,
            'permissions' => $permissions,
            'coreRoles' => self::CORE_ROLES,
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        $role = Role::query()->create([
            'name' => $validated['name'],
            'guard_name' => 'web',
        ]);

        $role->syncPermissions($validated['permissions'] ?? []);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role baru berhasil ditambahkan.',
        ]);

        return to_route('roles.index');
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        $validated = $request->validated();
        $isCoreRole = in_array($role->name, self::CORE_ROLES, true);

        if ($isCoreRole && $validated['name'] !== $role->name) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Nama role bawaan sistem tidak dapat diubah.',
            ]);

            return back();
        }

        $permissions = $validated['permissions'] ?? [];

        if ($role->name === 'admin') {
            $permissions = array_values(array_unique([
                ...$permissions,
                'users.view',
                'users.manage',
                'roles.manage',
            ]));
        }

        $role->update([
            'name' => $isCoreRole ? $role->name : $validated['name'],
        ]);

        $role->syncPermissions($permissions);
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role dan hak akses berhasil diperbarui.',
        ]);

        return back();
    }

    public function destroy(Role $role): RedirectResponse
    {
        if (in_array($role->name, self::CORE_ROLES, true)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Role bawaan sistem tidak dapat dihapus.',
            ]);

            return back();
        }

        if ($role->users()->exists()) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Role tidak dapat dihapus karena masih digunakan oleh pengguna.',
            ]);

            return back();
        }

        $role->delete();
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Role berhasil dihapus.',
        ]);

        return back();
    }
}
