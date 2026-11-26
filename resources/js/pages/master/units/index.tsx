import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Ruler, Trash2 } from 'lucide-react';
import type { FormEvent } from 'react';
import { useCallback, useState } from 'react';
import {
    ConfirmDialog,
    DataTable,
    FilterBar,
    FormField,
    PageContainer,
    PageHeader,
    Pagination,
    SearchInput,
} from '@/components/common';
import type {
    DataTableColumn,
    LaravelPaginator,
    SortDirection,
} from '@/components/common';
import { Button } from '@/components/ui/button';
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
import { Spinner } from '@/components/ui/spinner';
import { destroy, index, store, update } from '@/routes/master/units';
import type { UnitRecord } from '@/types';

type Props = {
    units: LaravelPaginator<UnitRecord>;
    filters: {
        search: string;
        sort_by: string;
        sort_direction: SortDirection;
        per_page: number;
    };
};

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateString));
}

export default function UnitsIndex({ units, filters }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingUnit, setEditingUnit] = useState<UnitRecord | null>(null);
    const [unitToDelete, setUnitToDelete] = useState<UnitRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm({
        code: '',
        name: '',
    });

    const applyQuery = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number> = {
                search: filters.search,
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

    const openCreateDialog = () => {
        setEditingUnit(null);
        form.clearErrors();
        form.setData({ code: '', name: '' });
        setDialogOpen(true);
    };

    const openEditDialog = (unit: UnitRecord) => {
        setEditingUnit(unit);
        form.clearErrors();
        form.setData({ code: unit.code, name: unit.name });
        setDialogOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingUnit) {
            form.put(update.url(editingUnit.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingUnit(null);
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
        if (!unitToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(unitToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setUnitToDelete(null);
            },
        });
    };

    const columns: DataTableColumn<UnitRecord>[] = [
        {
            key: 'code',
            header: 'Kode',
            sortable: true,
            headerClassName: 'w-36',
            cell: (row) => (
                <span className="inline-flex items-center rounded-md border border-border bg-slate-50 px-2 py-0.5 font-mono text-xs font-semibold text-slate-800 dark:bg-slate-800 dark:text-slate-100">
                    {row.code}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Nama Satuan',
            sortable: true,
            cell: (row) => (
                <span className="font-medium text-slate-900 dark:text-slate-100">
                    {row.name}
                </span>
            ),
        },
        {
            key: 'usage',
            header: 'Penggunaan',
            cell: (row) => {
                const itemsCount = row.items_count ?? 0;
                const conversionsCount = row.conversions_count ?? 0;

                return (
                    <span className="text-xs text-muted-foreground tabular-nums">
                        {itemsCount} barang &middot; {conversionsCount} konversi
                    </span>
                );
            },
        },
        {
            key: 'created_at',
            header: 'Dibuat',
            sortable: true,
            className: 'whitespace-nowrap text-xs text-muted-foreground',
            cell: (row) => formatDate(row.created_at),
        },
        {
            key: 'actions',
            header: '',
            align: 'right',
            headerClassName: 'w-12',
            cell: (row) => (
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
                    <DropdownMenuContent align="end" className="w-40">
                        <DropdownMenuItem
                            onClick={() => openEditDialog(row)}
                            className="cursor-pointer"
                        >
                            <Pencil className="size-4" />
                            Ubah satuan
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setUnitToDelete(row)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="size-4" />
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <Head title="Master Satuan" />

            <PageContainer>
                <PageHeader
                    title="Master Satuan"
                    description="Kelola daftar satuan ukur dasar dan satuan konversi untuk seluruh barang inventaris."
                    badge={units.total}
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            onClick={openCreateDialog}
                            className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                        >
                            <Plus className="size-4" />
                            Tambah Satuan
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={units.data}
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
                            hasActiveFilters={Boolean(filters.search)}
                            onResetFilters={() =>
                                applyQuery({ search: '', page: 1 })
                            }
                        >
                            <SearchInput
                                value={filters.search}
                                onChange={(value) =>
                                    applyQuery({ search: value, page: 1 })
                                }
                                debounceMs={300}
                                placeholder="Cari kode atau nama satuan..."
                            />
                        </FilterBar>
                    }
                    footer={
                        <Pagination
                            paginator={units}
                            onPerPageChange={(perPage) =>
                                applyQuery({ per_page: perPage, page: 1 })
                            }
                            itemLabel="satuan"
                        />
                    }
                    emptyState={{
                        icon: Ruler,
                        title: filters.search
                            ? 'Satuan tidak ditemukan'
                            : 'Belum ada data satuan',
                        description: filters.search
                            ? 'Coba gunakan kata kunci lain untuk menemukan satuan.'
                            : 'Tambahkan satuan seperti PCS, LBR, ROLL, atau MTR untuk mulai mengelola inventaris.',
                        action: filters.search ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    applyQuery({ search: '', page: 1 })
                                }
                                className="cursor-pointer"
                            >
                                Reset Pencarian
                            </Button>
                        ) : (
                            <Button
                                type="button"
                                size="sm"
                                onClick={openCreateDialog}
                                className="cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                            >
                                <Plus className="size-4" />
                                Tambah Satuan Pertama
                            </Button>
                        ),
                    }}
                />
            </PageContainer>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[440px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editingUnit
                                    ? 'Ubah Satuan'
                                    : 'Tambah Satuan Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Kode satuan bersifat unik dan akan otomatis
                                disimpan dalam huruf kapital.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <FormField
                                label="Kode Satuan"
                                htmlFor="unit-code"
                                required
                                hint="Maksimal 10 karakter, contoh: PCS, LBR, ROLL, MTR."
                                error={form.errors.code}
                            >
                                <Input
                                    id="unit-code"
                                    value={form.data.code}
                                    onChange={(event) =>
                                        form.setData(
                                            'code',
                                            event.target.value.toUpperCase(),
                                        )
                                    }
                                    maxLength={10}
                                    placeholder="PCS"
                                    required
                                    className="font-mono uppercase"
                                />
                            </FormField>

                            <FormField
                                label="Nama Satuan"
                                htmlFor="unit-name"
                                required
                                error={form.errors.name}
                            >
                                <Input
                                    id="unit-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    maxLength={50}
                                    placeholder="Pieces / Buah"
                                    required
                                />
                            </FormField>
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
                                {editingUnit ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(unitToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setUnitToDelete(null);
                    }
                }}
                title="Hapus satuan?"
                description={
                    unitToDelete
                        ? `Satuan "${unitToDelete.name}" (${unitToDelete.code}) akan dihapus permanen. Satuan yang masih dipakai barang tidak dapat dihapus.`
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

UnitsIndex.layout = {
    breadcrumbs: [{ title: 'Master Data' }, { title: 'Satuan', href: index() }],
};
