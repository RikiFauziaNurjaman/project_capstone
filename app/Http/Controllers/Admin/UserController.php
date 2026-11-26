<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\StoreUserRequest;
use App\Http\Requests\Admin\UpdateUserRequest;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    /**
     * @var list<string>
     */
    private const array LEGACY_ENUM_ROLES = ['admin', 'gudang', 'pimpinan'];

    public function index(Request $request): Response
    {
        $search = trim((string) $request->string('search'));
        $roleFilter = trim((string) $request->string('role'));
        $verifiedFilter = trim((string) $request->string('verified'));
        $sortBy = in_array($request->string('sort_by')->toString(), ['name', 'email', 'created_at'], true)
            ? $request->string('sort_by')->toString()
            : 'name';
        $sortDirection = $request->string('sort_direction')->toString() === 'desc' ? 'desc' : 'asc';
        $perPage = in_array($request->integer('per_page', 10), [10, 25, 50, 100], true)
            ? $request->integer('per_page', 10)
            : 10;

        $users = User::query()
            ->with('roles:id,name')
            ->search($search)
            ->when($roleFilter !== '', fn ($query) => $query->role($roleFilter))
            ->when($verifiedFilter === 'yes', fn ($query) => $query->whereNotNull('email_verified_at'))
            ->when($verifiedFilter === 'no', fn ($query) => $query->whereNull('email_verified_at'))
            ->orderBy($sortBy, $sortDirection)
            ->paginate($perPage)
            ->withQueryString();

        $roles = Role::query()
            ->where('guard_name', 'web')
            ->withCount('users')
            ->orderBy('name')
            ->get(['id', 'name']);

        $totalUsers = User::query()->count();
        $verifiedUsers = User::query()->whereNotNull('email_verified_at')->count();
        $adminCount = User::query()->role('admin')->count();

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
            'stats' => [
                'total' => $totalUsers,
                'verified' => $verifiedUsers,
                'admins' => $adminCount,
                'roles_count' => $roles->count(),
            ],
            'filters' => [
                'search' => $search,
                'role' => $roleFilter,
                'verified' => $verifiedFilter,
                'sort_by' => $sortBy,
                'sort_direction' => $sortDirection,
                'per_page' => $perPage,
            ],
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $validated = $request->validated();

        DB::transaction(function () use ($validated): void {
            $user = new User;
            $user->forceFill([
                'name' => $validated['name'],
                'email' => $validated['email'],
                'password' => $validated['password'],
                'role' => $this->resolveLegacyRole($validated['role']),
                'email_verified_at' => $validated['email_verified'] ? now() : null,
            ])->save();

            $user->syncRoles([$validated['role']]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pengguna baru berhasil ditambahkan.',
        ]);

        return to_route('users.index');
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $validated = $request->validated();
        $isDemotingAdmin = $user->hasRole('admin') && $validated['role'] !== 'admin';

        if ($isDemotingAdmin) {
            if ($request->user()?->is($user)) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'Anda tidak dapat menurunkan role admin pada akun Anda sendiri.',
                ]);

                return back();
            }

            if (User::query()->role('admin')->count() <= 1) {
                Inertia::flash('toast', [
                    'type' => 'error',
                    'message' => 'Minimal harus ada satu pengguna dengan role admin aktif.',
                ]);

                return back();
            }
        }

        DB::transaction(function () use ($user, $validated): void {
            $attributes = [
                'name' => $validated['name'],
                'email' => $validated['email'],
                'role' => $this->resolveLegacyRole($validated['role']),
                'email_verified_at' => $validated['email_verified']
                    ? ($user->email_verified_at ?? now())
                    : null,
            ];

            if (! empty($validated['password'])) {
                $attributes['password'] = $validated['password'];
            }

            $user->forceFill($attributes)->save();
            $user->syncRoles([$validated['role']]);
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Data pengguna berhasil diperbarui.',
        ]);

        return back();
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Anda tidak dapat menghapus akun yang sedang digunakan.',
            ]);

            return back();
        }

        if ($user->hasRole('admin') && User::query()->role('admin')->count() <= 1) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Tidak dapat menghapus satu-satunya pengguna admin.',
            ]);

            return back();
        }

        $hasTransactions = $user->goodsReceipts()->exists()
            || $user->goodsIssues()->exists()
            || $user->stockOpnames()->exists();

        if ($hasTransactions) {
            Inertia::flash('toast', [
                'type' => 'error',
                'message' => 'Pengguna tidak dapat dihapus karena tercatat pada riwayat transaksi inventaris.',
            ]);

            return back();
        }

        DB::transaction(function () use ($user): void {
            $user->syncRoles([]);
            $user->syncPermissions([]);
            $user->delete();
        });

        Inertia::flash('toast', [
            'type' => 'success',
            'message' => 'Pengguna berhasil dihapus.',
        ]);

        return back();
    }

    private function resolveLegacyRole(string $spatieRole): string
    {
        return in_array($spatieRole, self::LEGACY_ENUM_ROLES, true)
            ? $spatieRole
            : 'gudang';
    }
}
