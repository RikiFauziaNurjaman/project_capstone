<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolePermissionSeeder extends Seeder
{
    /**
     * @var list<string>
     */
    public const array PERMISSIONS = [
        'dashboard.view',
        'master.items.view',
        'master.items.manage',
        'master.categories.view',
        'master.categories.manage',
        'master.units.view',
        'master.units.manage',
        'master.suppliers.view',
        'master.suppliers.manage',
        'transactions.view',
        'transactions.manage',
        'reports.view',
        'users.view',
        'users.manage',
        'roles.manage',
    ];

    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        foreach (self::PERMISSIONS as $permission) {
            Permission::findOrCreate($permission, 'web');
        }

        // Clear cached permissions explicitly in case DatabaseSeeder uses WithoutModelEvents.
        app(PermissionRegistrar::class)->forgetCachedPermissions();

        $admin = Role::findOrCreate('admin', 'web');
        $admin->syncPermissions(self::PERMISSIONS);

        $gudang = Role::findOrCreate('gudang', 'web');
        $gudang->syncPermissions([
            'dashboard.view',
            'master.items.view',
            'master.items.manage',
            'master.categories.view',
            'master.categories.manage',
            'master.units.view',
            'master.units.manage',
            'master.suppliers.view',
            'master.suppliers.manage',
            'transactions.view',
            'transactions.manage',
            'reports.view',
        ]);

        $pimpinan = Role::findOrCreate('pimpinan', 'web');
        $pimpinan->syncPermissions([
            'dashboard.view',
            'master.items.view',
            'master.categories.view',
            'master.units.view',
            'master.suppliers.view',
            'transactions.view',
            'reports.view',
        ]);

        app(PermissionRegistrar::class)->forgetCachedPermissions();
    }
}
