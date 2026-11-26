import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    KeyRound,
    Pencil,
    Plus,
    ShieldCheck,
    Trash2,
    Users,
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useMemo, useState } from 'react';
import {
    ConfirmDialog,
    FormField,
    PageContainer,
    PageHeader,
    SectionCard,
    StatusBadge,
} from '@/components/common';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { destroy, index as rolesIndex, store, update } from '@/routes/roles';
import { index as usersIndex } from '@/routes/users';
import type { PermissionRecord, RoleRecord } from '@/types';

type Props = {
    roles: RoleRecord[];
    permissions: PermissionRecord[];
    coreRoles: string[];
};

type PermissionGroupMeta = {
    key: string;
    title: string;
    items: Array<{ name: string; label: string }>;
};

const PERMISSION_LABELS: Record<string, string> = {
    'dashboard.view': 'Lihat Ringkasan Dashboard',
    'master.items.view': 'Lihat Master Barang',
    'master.items.manage': 'Kelola Master Barang (CRUD)',
    'master.categories.view': 'Lihat Master Kategori',
    'master.categories.manage': 'Kelola Master Kategori (CRUD)',
    'master.units.view': 'Lihat Master Satuan',
    'master.units.manage': 'Kelola Master Satuan (CRUD)',
    'master.suppliers.view': 'Lihat Master Supplier',
    'master.suppliers.manage': 'Kelola Master Supplier (CRUD)',
    'transactions.view': 'Lihat Transaksi Barang',
    'transactions.manage': 'Kelola Barang Masuk / Keluar & Opname',
    'reports.view': 'Lihat & Ekspor Laporan',
    'users.view': 'Lihat Daftar Pengguna',
    'users.manage': 'Kelola Pengguna (CRUD)',
    'roles.manage': 'Kelola Role & Hak Akses',
};

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

function groupPermissions(
    permissions: PermissionRecord[],
): PermissionGroupMeta[] {
    const buckets: Record<string, PermissionGroupMeta> = {
        dashboard: { key: 'dashboard', title: 'Ringkasan', items: [] },
        master: { key: 'master', title: 'Master Data', items: [] },
        operations: {
            key: 'operations',
            title: 'Transaksi & Laporan',
            items: [],
        },
        access: {
            key: 'access',
            title: 'Pengguna & Hak Akses',
            items: [],
        },
    };

    for (const permission of permissions) {
        const entry = {
            name: permission.name,
            label: PERMISSION_LABELS[permission.name] ?? permission.name,
        };

        if (permission.name.startsWith('dashboard.')) {
            buckets.dashboard.items.push(entry);
        } else if (permission.name.startsWith('master.')) {
            buckets.master.items.push(entry);
        } else if (
            permission.name.startsWith('transactions.') ||
            permission.name.startsWith('reports.')
        ) {
            buckets.operations.items.push(entry);
        } else {
            buckets.access.items.push(entry);
        }
    }

    return Object.values(buckets).filter((group) => group.items.length > 0);
}

export default function RolesIndex({ roles, permissions, coreRoles }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<RoleRecord | null>(null);
    const [roleToDelete, setRoleToDelete] = useState<RoleRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm({
        name: '',
        permissions: [] as string[],
    });

    const permissionGroups = useMemo(
        () => groupPermissions(permissions),
        [permissions],
    );

    const isEditingCoreRole = Boolean(
        editingRole && coreRoles.includes(editingRole.name),
    );

    const openCreateDialog = () => {
        setEditingRole(null);
        form.clearErrors();
        form.setData({ name: '', permissions: ['dashboard.view'] });
        setDialogOpen(true);
    };

    const openEditDialog = (role: RoleRecord) => {
        setEditingRole(role);
        form.clearErrors();
        form.setData({
            name: role.name,
            permissions: (role.permissions ?? []).map((item) => item.name),
        });
        setDialogOpen(true);
    };

    const togglePermission = (permissionName: string, checked: boolean) => {
        if (checked) {
            if (!form.data.permissions.includes(permissionName)) {
                form.setData('permissions', [
                    ...form.data.permissions,
                    permissionName,
                ]);
            }
        } else {
            form.setData(
                'permissions',
                form.data.permissions.filter((item) => item !== permissionName),
            );
        }
    };

    const toggleGroup = (group: PermissionGroupMeta) => {
        const groupNames = group.items.map((item) => item.name);
        const allSelected = groupNames.every((name) =>
            form.data.permissions.includes(name),
        );

        if (allSelected) {
            form.setData(
                'permissions',
                form.data.permissions.filter(
                    (name) => !groupNames.includes(name),
                ),
            );
        } else {
            const merged = new Set([...form.data.permissions, ...groupNames]);
            form.setData('permissions', Array.from(merged));
        }
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingRole) {
            form.put(update.url(String(editingRole.id)), {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingRole(null);
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
        if (!roleToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(String(roleToDelete.id)), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setRoleToDelete(null);
            },
        });
    };

    return (
        <>
            <Head title="Role & Hak Akses" />

            <PageContainer>
                <div className="flex items-center gap-1 border-b border-border">
                    <Link
                        href={usersIndex()}
                        prefetch
                        className="inline-flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-[13.5px] font-medium text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <Users className="size-4" />
                        Pengguna
                    </Link>
                    <Link
                        href={rolesIndex()}
                        className="inline-flex items-center gap-2 border-b-2 border-brand px-3 py-2 text-[13.5px] font-semibold text-slate-900 dark:text-slate-100"
                    >
                        <KeyRound className="size-4 text-brand" />
                        Role &amp; Hak Akses
                    </Link>
                </div>

                <PageHeader
                    title="Role & Hak Akses"
                    description="Atur role dan matriks izin (permissions) menggunakan Spatie Laravel Permission."
                    badge={roles.length}
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            onClick={openCreateDialog}
                            className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                        >
                            <Plus className="size-4" />
                            Tambah Role
                        </Button>
                    }
                />

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                    {roles.map((role) => {
                        const isCore = coreRoles.includes(role.name);
                        const rolePermissions = role.permissions ?? [];

                        return (
                            <SectionCard
                                key={role.id}
                                title={formatRoleLabel(role.name)}
                                description={`${role.users_count ?? 0} pengguna · ${rolePermissions.length} dari ${permissions.length} izin aktif`}
                                actions={
                                    isCore ? (
                                        <StatusBadge
                                            variant="neutral"
                                            dot={false}
                                        >
                                            Bawaan
                                        </StatusBadge>
                                    ) : null
                                }
                                footer={
                                    <div className="flex items-center justify-between gap-2">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(role)}
                                            className="h-8 cursor-pointer bg-white text-xs dark:bg-slate-900"
                                        >
                                            <Pencil className="size-3.5" />
                                            Atur Hak Akses
                                        </Button>

                                        {!isCore && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() =>
                                                    setRoleToDelete(role)
                                                }
                                                className="h-8 cursor-pointer text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Trash2 className="size-3.5" />
                                                Hapus
                                            </Button>
                                        )}
                                    </div>
                                }
                            >
                                <div className="space-y-2.5">
                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                        <ShieldCheck className="size-3.5 text-slate-400" />
                                        <span className="font-mono">
                                            {role.name}
                                        </span>
                                    </div>

                                    {rolePermissions.length === 0 ? (
                                        <p className="text-xs text-muted-foreground">
                                            Belum ada hak akses yang ditetapkan.
                                        </p>
                                    ) : (
                                        <div className="flex flex-wrap gap-1.5">
                                            {rolePermissions
                                                .slice(0, 6)
                                                .map((permission) => (
                                                    <span
                                                        key={permission.id}
                                                        className="rounded-md border border-border bg-slate-50 px-2 py-0.5 text-[11px] text-slate-700 dark:bg-slate-800/80 dark:text-slate-300"
                                                    >
                                                        {PERMISSION_LABELS[
                                                            permission.name
                                                        ] ?? permission.name}
                                                    </span>
                                                ))}
                                            {rolePermissions.length > 6 && (
                                                <span className="rounded-md bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground tabular-nums">
                                                    +
                                                    {rolePermissions.length - 6}{' '}
                                                    lainnya
                                                </span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </SectionCard>
                        );
                    })}
                </div>
            </PageContainer>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[640px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editingRole
                                    ? `Atur Role: ${formatRoleLabel(editingRole.name)}`
                                    : 'Tambah Role Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Pilih izin yang boleh diakses oleh pengguna
                                dengan role ini.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 py-4">
                            <FormField
                                label="Nama Role"
                                htmlFor="role-name"
                                required
                                hint={
                                    isEditingCoreRole
                                        ? 'Nama role bawaan tidak dapat diubah.'
                                        : 'Gunakan huruf kecil tanpa spasi, contoh: supervisor_gudang.'
                                }
                                error={form.errors.name}
                            >
                                <Input
                                    id="role-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData(
                                            'name',
                                            event.target.value.toLowerCase(),
                                        )
                                    }
                                    disabled={isEditingCoreRole}
                                    maxLength={50}
                                    placeholder="supervisor_gudang"
                                    required
                                    className="font-mono"
                                />
                            </FormField>

                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                        Matriks Hak Akses
                                    </h3>
                                    <span className="text-xs text-muted-foreground tabular-nums">
                                        {form.data.permissions.length} dari{' '}
                                        {permissions.length} dipilih
                                    </span>
                                </div>

                                <div className="grid gap-3">
                                    {permissionGroups.map((group) => {
                                        const allSelected = group.items.every(
                                            (item) =>
                                                form.data.permissions.includes(
                                                    item.name,
                                                ),
                                        );

                                        return (
                                            <div
                                                key={group.key}
                                                className="rounded-lg border border-border p-3.5"
                                            >
                                                <div className="mb-2.5 flex items-center justify-between border-b border-border/70 pb-2">
                                                    <span className="text-xs font-semibold tracking-wider text-slate-700 uppercase dark:text-slate-200">
                                                        {group.title}
                                                    </span>
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            toggleGroup(group)
                                                        }
                                                        className="cursor-pointer text-xs font-medium text-brand hover:underline"
                                                    >
                                                        {allSelected
                                                            ? 'Hapus semua'
                                                            : 'Pilih semua'}
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                                                    {group.items.map((item) => {
                                                        const checked =
                                                            form.data.permissions.includes(
                                                                item.name,
                                                            );
                                                        const lockedForAdmin =
                                                            editingRole?.name ===
                                                                'admin' &&
                                                            (item.name ===
                                                                'users.view' ||
                                                                item.name ===
                                                                    'users.manage' ||
                                                                item.name ===
                                                                    'roles.manage');

                                                        return (
                                                            <div
                                                                key={item.name}
                                                                className="flex items-start gap-2"
                                                            >
                                                                <Checkbox
                                                                    id={`perm-${item.name}`}
                                                                    checked={
                                                                        checked ||
                                                                        lockedForAdmin
                                                                    }
                                                                    disabled={
                                                                        lockedForAdmin
                                                                    }
                                                                    onCheckedChange={(
                                                                        state,
                                                                    ) =>
                                                                        togglePermission(
                                                                            item.name,
                                                                            state ===
                                                                                true,
                                                                        )
                                                                    }
                                                                    className="mt-0.5"
                                                                />
                                                                <Label
                                                                    htmlFor={`perm-${item.name}`}
                                                                    className="cursor-pointer text-xs leading-snug font-normal text-slate-700 dark:text-slate-200"
                                                                >
                                                                    {item.label}
                                                                </Label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="gap-2 border-t border-border pt-4">
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
                                {editingRole ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(roleToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setRoleToDelete(null);
                    }
                }}
                title="Hapus role?"
                description={
                    roleToDelete
                        ? `Role "${roleToDelete.name}" akan dihapus permanen. Role yang masih dipakai pengguna tidak dapat dihapus.`
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

RolesIndex.layout = {
    breadcrumbs: [
        { title: 'Pengguna & Akses', href: usersIndex() },
        { title: 'Role & Hak Akses', href: rolesIndex() },
    ],
};
