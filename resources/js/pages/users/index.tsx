import { Head, Link, router, useForm, usePage } from '@inertiajs/react';
import {
    CheckCircle2,
    KeyRound,
    MoreHorizontal,
    Pencil,
    Plus,
    Shield,
    Trash2,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
    ConfirmDialog,
    DataTable,
    FilterBar,
    FilterSelect,
    FormField,
    PageContainer,
    PageHeader,
    Pagination,
    SearchInput,
    StatCard,
    StatCardGrid,
    StatusBadge,
} from '@/components/common';
import type {
    ActiveFilterChip,
    DataTableColumn,
    LaravelPaginator,
    SortDirection,
    StatusBadgeVariant,
} from '@/components/common';
import PasswordInput from '@/components/password-input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { index as rolesIndex } from '@/routes/roles';
import { destroy, index, store, update } from '@/routes/users';
import type { ManagedUserRecord, RoleRecord, UserStats } from '@/types';

type Props = {
    users: LaravelPaginator<ManagedUserRecord>;
    roles: RoleRecord[];
    stats: UserStats;
    filters: {
        search: string;
        role: string;
        verified: string;
        sort_by: string;
        sort_direction: SortDirection;
        per_page: number;
    };
};

const VERIFIED_OPTIONS = [
    { value: 'yes', label: 'Terverifikasi' },
    { value: 'no', label: 'Belum Verifikasi' },
];

function formatRoleLabel(roleName: string): string {
    const labels: Record<string, string> = {
        admin: 'Admin',
        gudang: 'Gudang',
        pimpinan: 'Pimpinan',
    };

    if (labels[roleName]) {
        return labels[roleName];
    }

    return roleName
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getRoleBadgeVariant(roleName: string): StatusBadgeVariant {
    switch (roleName) {
        case 'admin':
            return 'brand';
        case 'gudang':
            return 'info';
        case 'pimpinan':
            return 'success';
        default:
            return 'neutral';
    }
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() ?? '')
        .join('');
}

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateString));
}

export default function UsersIndex({ users, roles, stats, filters }: Props) {
    const { auth } = usePage().props;
    const currentUserId = auth?.user?.id;
    const userRoles = auth?.roles ?? [];
    const userPermissions = auth?.permissions ?? [];
    const canManageUsers =
        userRoles.includes('admin') || userPermissions.includes('users.manage');
    const canManageRoles =
        userRoles.includes('admin') || userPermissions.includes('roles.manage');

    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUser, setEditingUser] = useState<ManagedUserRecord | null>(
        null,
    );
    const [userToDelete, setUserToDelete] = useState<ManagedUserRecord | null>(
        null,
    );
    const [deleting, setDeleting] = useState(false);

    const form = useForm({
        name: '',
        email: '',
        role: roles[0]?.name ?? 'gudang',
        password: '',
        password_confirmation: '',
        email_verified: true,
    });

    const applyQuery = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number> = {
                search: filters.search,
                role: filters.role,
                verified: filters.verified,
                sort_by: filters.sort_by,
                sort_direction: filters.sort_direction,
                per_page: filters.per_page,
                ...overrides,
            };

            const cleaned = Object.fromEntries(
                Object.entries(params).filter(
                    ([, value]) =>
                        value !== '' && value !== undefined && value !== null,
                ),
            );

            router.get(index.url(), cleaned, {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            });
        },
        [filters],
    );

    const roleSelectOptions = useMemo(
        () =>
            roles.map((role) => ({
                value: role.name,
                label: formatRoleLabel(role.name),
            })),
        [roles],
    );

    const activeFilterChips: ActiveFilterChip[] = [];
    if (filters.role) {
        activeFilterChips.push({
            key: 'role',
            label: 'Role',
            valueLabel: formatRoleLabel(filters.role),
            onRemove: () => applyQuery({ role: '', page: 1 }),
        });
    }
    if (filters.verified) {
        activeFilterChips.push({
            key: 'verified',
            label: 'Verifikasi',
            valueLabel:
                filters.verified === 'yes'
                    ? 'Terverifikasi'
                    : 'Belum Verifikasi',
            onRemove: () => applyQuery({ verified: '', page: 1 }),
        });
    }

    const openCreateDialog = () => {
        setEditingUser(null);
        form.clearErrors();
        form.setData({
            name: '',
            email: '',
            role:
                roles.find((role) => role.name === 'gudang')?.name ??
                roles[0]?.name ??
                'gudang',
            password: '',
            password_confirmation: '',
            email_verified: true,
        });
        setDialogOpen(true);
    };

    const openEditDialog = (user: ManagedUserRecord) => {
        setEditingUser(user);
        form.clearErrors();
        form.setData({
            name: user.name,
            email: user.email,
            role: user.roles[0]?.name ?? user.role ?? 'gudang',
            password: '',
            password_confirmation: '',
            email_verified: Boolean(user.email_verified_at),
        });
        setDialogOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingUser) {
            form.put(update.url(editingUser.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingUser(null);
                    form.reset();
                },
            });

            return;
        }

        form.post(store.url(), {
            preserveScroll: true,
            onSuccess: () => {
                setDialogOpen(false);
                form.reset();
            },
        });
    };

    const handleDeleteConfirm = () => {
        if (!userToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(userToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setUserToDelete(null);
            },
        });
    };

    const columns: DataTableColumn<ManagedUserRecord>[] = [
        {
            key: 'name',
            header: 'Pengguna',
            sortable: true,
            cell: (row) => {
                const isSelf = row.id === currentUserId;

                return (
                    <div className="flex min-w-[220px] items-center gap-3">
                        <span className="inline-flex size-8 shrink-0 items-center justify-center rounded-lg border border-border bg-slate-100 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                            {getInitials(row.name)}
                        </span>
                        <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                                <p className="truncate font-medium text-slate-900 dark:text-slate-100">
                                    {row.name}
                                </p>
                                {isSelf && (
                                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                        Anda
                                    </span>
                                )}
                            </div>
                            <p className="truncate text-xs text-muted-foreground">
                                {row.email}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            key: 'role',
            header: 'Role',
            cell: (row) => {
                const roleName = row.roles[0]?.name ?? row.role;

                return (
                    <StatusBadge variant={getRoleBadgeVariant(roleName)}>
                        {formatRoleLabel(roleName)}
                    </StatusBadge>
                );
            },
        },
        {
            key: 'email_verified_at',
            header: 'Status Email',
            cell: (row) =>
                row.email_verified_at ? (
                    <StatusBadge variant="success">Terverifikasi</StatusBadge>
                ) : (
                    <StatusBadge variant="warning">
                        Belum Verifikasi
                    </StatusBadge>
                ),
        },
        {
            key: 'created_at',
            header: 'Dibuat',
            sortable: true,
            className: 'whitespace-nowrap text-xs text-muted-foreground',
            cell: (row) => formatDate(row.created_at),
        },
        ...(canManageUsers
            ? [
                  {
                      key: 'actions',
                      header: '',
                      align: 'right' as const,
                      headerClassName: 'w-12',
                      cell: (row: ManagedUserRecord) => {
                          const isSelf = row.id === currentUserId;

                          return (
                              <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                      <Button
                                          type="button"
                                          variant="ghost"
                                          size="icon"
                                          aria-label={`Aksi untuk ${row.name}`}
                                          className="size-8 cursor-pointer text-slate-500 hover:text-slate-900"
                                      >
                                          <MoreHorizontal className="size-4" />
                                      </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent
                                      align="end"
                                      className="w-40"
                                  >
                                      <DropdownMenuItem
                                          onClick={() => openEditDialog(row)}
                                          className="cursor-pointer"
                                      >
                                          <Pencil className="size-4" />
                                          Ubah pengguna
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                          variant="destructive"
                                          disabled={isSelf}
                                          onClick={() => setUserToDelete(row)}
                                          className="cursor-pointer text-destructive focus:text-destructive"
                                      >
                                          <Trash2 className="size-4" />
                                          Hapus
                                      </DropdownMenuItem>
                                  </DropdownMenuContent>
                              </DropdownMenu>
                          );
                      },
                  },
              ]
            : []),
    ];

    const hasFilters = Boolean(
        filters.search || filters.role || filters.verified,
    );

    return (
        <>
            <Head title="Manajemen Pengguna" />

            <PageContainer>
                {/* Clean navigation tabs between Users & Roles */}
                <div className="flex items-center gap-1 border-b border-border">
                    <Link
                        href={index()}
                        className="inline-flex items-center gap-2 border-b-2 border-brand px-3 py-2 text-[13.5px] font-semibold text-slate-900 dark:text-slate-100"
                    >
                        <Users className="size-4 text-brand" />
                        Pengguna
                    </Link>
                    {canManageRoles && (
                        <Link
                            href={rolesIndex()}
                            prefetch
                            className="inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                        >
                            <KeyRound className="size-4" />
                            Role &amp; Hak Akses
                        </Link>
                    )}
                </div>

                <PageHeader
                    title="Manajemen Pengguna"
                    description="Kelola akun karyawan, penetapan role Spatie, dan status verifikasi akses sistem."
                    badge={stats.total}
                    actions={
                        canManageUsers && (
                            <Button
                                type="button"
                                size="sm"
                                onClick={openCreateDialog}
                                className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                            >
                                <Plus className="size-4" />
                                Tambah Pengguna
                            </Button>
                        )
                    }
                />

                <StatCardGrid columns={4}>
                    <StatCard
                        label="Total Pengguna"
                        value={stats.total}
                        icon={Users}
                        tone="brand"
                        helper="akun terdaftar"
                    />
                    <StatCard
                        label="Terverifikasi"
                        value={stats.verified}
                        icon={CheckCircle2}
                        tone="success"
                        helper="email aktif"
                    />
                    <StatCard
                        label="Administrator"
                        value={stats.admins}
                        icon={Shield}
                        tone="default"
                        helper="akses penuh sistem"
                    />
                    <StatCard
                        label="Role Tersedia"
                        value={stats.roles_count}
                        icon={KeyRound}
                        tone="default"
                        helper="dikelola Spatie Permission"
                    />
                </StatCardGrid>

                <DataTable
                    columns={columns}
                    data={users.data}
                    rowKey={(row) => row.id}
                    sortBy={filters.sort_by}
                    sortDirection={filters.sort_direction}
                    onSort={(columnKey, direction) =>
                        applyQuery({
                            sort_by: columnKey,
                            sort_direction: direction,
                            page: 1,
                        })
                    }
                    toolbar={
                        <FilterBar
                            activeFilters={activeFilterChips}
                            hasActiveFilters={hasFilters}
                            onResetFilters={() =>
                                applyQuery({
                                    search: '',
                                    role: '',
                                    verified: '',
                                    page: 1,
                                })
                            }
                        >
                            <SearchInput
                                value={filters.search}
                                onChange={(value) =>
                                    applyQuery({ search: value, page: 1 })
                                }
                                debounceMs={300}
                                placeholder="Cari nama atau email pengguna..."
                            />
                            <FilterSelect
                                value={filters.role}
                                onValueChange={(value) =>
                                    applyQuery({ role: value, page: 1 })
                                }
                                options={roleSelectOptions}
                                placeholder="Semua role"
                                allLabel="Semua role"
                            />
                            <FilterSelect
                                value={filters.verified}
                                onValueChange={(value) =>
                                    applyQuery({ verified: value, page: 1 })
                                }
                                options={VERIFIED_OPTIONS}
                                placeholder="Semua status email"
                                allLabel="Semua status email"
                            />
                        </FilterBar>
                    }
                    footer={
                        <Pagination
                            paginator={users}
                            onPerPageChange={(perPage) =>
                                applyQuery({ per_page: perPage, page: 1 })
                            }
                            itemLabel="pengguna"
                        />
                    }
                    emptyState={{
                        icon: Users,
                        title: 'Pengguna tidak ditemukan',
                        description:
                            'Coba ubah kata kunci pencarian atau reset filter role yang aktif.',
                        action: hasFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    applyQuery({
                                        search: '',
                                        role: '',
                                        verified: '',
                                        page: 1,
                                    })
                                }
                                className="cursor-pointer"
                            >
                                Reset Filter
                            </Button>
                        ) : undefined,
                    }}
                />
            </PageContainer>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editingUser
                                    ? 'Ubah Data Pengguna'
                                    : 'Tambah Pengguna Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Tetapkan role akses pengguna sesuai tanggung
                                jawab operasionalnya.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <FormField
                                label="Nama Lengkap"
                                htmlFor="user-name"
                                required
                                error={form.errors.name}
                            >
                                <Input
                                    id="user-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    maxLength={100}
                                    placeholder="Budi Santoso"
                                    required
                                />
                            </FormField>

                            <FormField
                                label="Alamat Email"
                                htmlFor="user-email"
                                required
                                error={form.errors.email}
                            >
                                <Input
                                    id="user-email"
                                    type="email"
                                    value={form.data.email}
                                    onChange={(event) =>
                                        form.setData(
                                            'email',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={150}
                                    placeholder="budi@mks.co.id"
                                    required
                                />
                            </FormField>

                            <FormField
                                label="Role Akses"
                                htmlFor="user-role"
                                required
                                error={form.errors.role}
                            >
                                <Select
                                    value={form.data.role || undefined}
                                    onValueChange={(value) =>
                                        form.setData('role', value)
                                    }
                                >
                                    <SelectTrigger
                                        id="user-role"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Pilih role pengguna" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map((role) => (
                                            <SelectItem
                                                key={role.id}
                                                value={role.name}
                                            >
                                                {formatRoleLabel(role.name)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </FormField>

                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    label={
                                        editingUser
                                            ? 'Kata Sandi Baru'
                                            : 'Kata Sandi'
                                    }
                                    htmlFor="user-password"
                                    required={!editingUser}
                                    hint={
                                        editingUser
                                            ? 'Kosongkan jika tidak diubah.'
                                            : 'Minimal 6 karakter.'
                                    }
                                    error={form.errors.password}
                                >
                                    <PasswordInput
                                        id="user-password"
                                        value={form.data.password}
                                        onChange={(event) =>
                                            form.setData(
                                                'password',
                                                event.target.value,
                                            )
                                        }
                                        required={!editingUser}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                    />
                                </FormField>

                                <FormField
                                    label="Konfirmasi Sandi"
                                    htmlFor="user-password-confirmation"
                                    required={!editingUser}
                                    error={form.errors.password_confirmation}
                                >
                                    <PasswordInput
                                        id="user-password-confirmation"
                                        value={form.data.password_confirmation}
                                        onChange={(event) =>
                                            form.setData(
                                                'password_confirmation',
                                                event.target.value,
                                            )
                                        }
                                        required={!editingUser}
                                        autoComplete="new-password"
                                        placeholder="••••••••"
                                    />
                                </FormField>
                            </div>

                            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-slate-50/60 px-3.5 py-2.5 dark:bg-slate-900/40">
                                <Checkbox
                                    id="user-email-verified"
                                    checked={form.data.email_verified}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'email_verified',
                                            checked === true,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="user-email-verified"
                                    className="cursor-pointer text-[13px] font-medium text-slate-700 dark:text-slate-200"
                                >
                                    Tandai email sebagai terverifikasi
                                </Label>
                            </div>
                        </div>

                        <DialogFooter className="gap-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setDialogOpen(false)}
                                disabled={form.processing}
                                className="cursor-pointer"
                            >
                                Batal
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.processing}
                                className="cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                            >
                                {form.processing && <Spinner />}
                                {editingUser ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(userToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setUserToDelete(null);
                    }
                }}
                title="Hapus pengguna?"
                description={
                    userToDelete
                        ? `Akun "${userToDelete.name}" (${userToDelete.email}) akan dihapus permanen. Pengguna dengan riwayat transaksi tidak dapat dihapus.`
                        : undefined
                }
                confirmLabel="Ya, Hapus"
                variant="destructive"
                processing={deleting}
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}

UsersIndex.layout = {
    breadcrumbs: [{ title: 'Pengguna & Akses', href: index() }],
};
