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
        $admin = User::query()->firstOrNew([
            'email' => 'admin@mks.co.id',
        ]);

        $admin->forceFill([
            'name' => 'Admin Gudang',
            'password' => 'admin123',
            'role' => 'admin',
            'email_verified_at' => $admin->email_verified_at ?? now(),
        ])->save();
    }
}
