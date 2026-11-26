<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $accounts = [
            [
                'email' => 'admin@mks.co.id',
                'name' => 'Admin Gudang',
                'password' => 'admin123',
                'role' => 'admin',
            ],
            [
                'email' => 'gudang@mks.co.id',
                'name' => 'Staf Gudang',
                'password' => 'gudang123',
                'role' => 'gudang',
            ],
            [
                'email' => 'pimpinan@mks.co.id',
                'name' => 'Pimpinan Operasional',
                'password' => 'pimpinan123',
                'role' => 'pimpinan',
            ],
        ];

        foreach ($accounts as $account) {
            $user = User::query()->firstOrNew([
                'email' => $account['email'],
            ]);

            $user->forceFill([
                'name' => $account['name'],
                'password' => $account['password'],
                'role' => $account['role'],
                'email_verified_at' => $user->email_verified_at ?? now(),
            ])->save();

            $user->syncRoles([$account['role']]);
        }
    }
}
