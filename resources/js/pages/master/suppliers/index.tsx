import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Trash2, Truck } from 'lucide-react';
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
import { destroy, index, store, update } from '@/routes/master/suppliers';
import type { SupplierRecord } from '@/types';

type Props = {
    suppliers: LaravelPaginator<SupplierRecord>;
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

export default function SuppliersIndex({ suppliers, filters }: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] =
        useState<SupplierRecord | null>(null);
    const [supplierToDelete, setSupplierToDelete] =
        useState<SupplierRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm({
        name: '',
        phone: '',
        address: '',
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
        setEditingSupplier(null);
        form.clearErrors();
        form.setData({ name: '', phone: '', address: '' });
        setDialogOpen(true);
    };

    const openEditDialog = (supplier: SupplierRecord) => {
        setEditingSupplier(supplier);
        form.clearErrors();
        form.setData({
            name: supplier.name,
            phone: supplier.phone ?? '',
            address: supplier.address ?? '',
        });
        setDialogOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingSupplier) {
            form.put(update.url(editingSupplier.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingSupplier(null);
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
        if (!supplierToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(supplierToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setSupplierToDelete(null);
            },
        });
    };

    const columns: DataTableColumn<SupplierRecord>[] = [
        {
            key: 'name',
            header: 'Nama Supplier',
            sortable: true,
            cell: (row) => (
                <span className="font-medium text-slate-900 dark:text-slate-100">
                    {row.name}
                </span>
            ),
        },
        {
            key: 'phone',
            header: 'No. Telepon',
            sortable: true,
            cell: (row) =>
                row.phone ? (
                    <span className="font-mono text-xs text-slate-700 tabular-nums dark:text-slate-300">
                        {row.phone}
                    </span>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        &mdash;
                    </span>
                ),
        },
        {
            key: 'address',
            header: 'Alamat',
            cell: (row) =>
                row.address ? (
                    <p className="max-w-md truncate text-slate-600 dark:text-slate-300">
                        {row.address}
                    </p>
                ) : (
                    <span className="text-xs text-muted-foreground">
                        &mdash;
                    </span>
                ),
        },
        {
            key: 'goods_receipts_count',
            header: 'Penerimaan',
            align: 'right',
            cell: (row) => (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {row.goods_receipts_count ?? 0} transaksi
                </span>
            ),
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
                            Ubah supplier
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setSupplierToDelete(row)}
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
            <Head title="Master Supplier" />

            <PageContainer>
                <PageHeader
                    title="Master Supplier"
                    description="Kelola daftar pemasok material, kelistrikan, dan komponen produksi perusahaan."
                    badge={suppliers.total}
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            onClick={openCreateDialog}
                            className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                        >
                            <Plus className="size-4" />
                            Tambah Supplier
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={suppliers.data}
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
                                placeholder="Cari nama, telepon, atau alamat supplier..."
                            />
                        </FilterBar>
                    }
                    footer={
                        <Pagination
                            paginator={suppliers}
                            onPerPageChange={(perPage) =>
                                applyQuery({ per_page: perPage, page: 1 })
                            }
                            itemLabel="supplier"
                        />
                    }
                    emptyState={{
                        icon: Truck,
                        title: filters.search
                            ? 'Supplier tidak ditemukan'
                            : 'Belum ada data supplier',
                        description: filters.search
                            ? 'Coba ubah kata kunci pencarian Anda.'
                            : 'Tambahkan data pemasok untuk mempermudah pencatatan penerimaan barang masuk.',
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
                                Tambah Supplier Pertama
                            </Button>
                        ),
                    }}
                />
            </PageContainer>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="sm:max-w-[480px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editingSupplier
                                    ? 'Ubah Supplier'
                                    : 'Tambah Supplier Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Masukkan informasi kontak dan alamat pemasok.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <FormField
                                label="Nama Supplier"
                                htmlFor="supplier-name"
                                required
                                error={form.errors.name}
                            >
                                <Input
                                    id="supplier-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    maxLength={150}
                                    placeholder="PT. Sumber Akrilik Nusantara"
                                    required
                                />
                            </FormField>

                            <FormField
                                label="No. Telepon / WhatsApp"
                                htmlFor="supplier-phone"
                                error={form.errors.phone}
                            >
                                <Input
                                    id="supplier-phone"
                                    value={form.data.phone}
                                    onChange={(event) =>
                                        form.setData(
                                            'phone',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={30}
                                    placeholder="0812-3456-7890"
                                />
                            </FormField>

                            <FormField
                                label="Alamat"
                                htmlFor="supplier-address"
                                error={form.errors.address}
                            >
                                <textarea
                                    id="supplier-address"
                                    rows={3}
                                    value={form.data.address}
                                    onChange={(event) =>
                                        form.setData(
                                            'address',
                                            event.target.value,
                                        )
                                    }
                                    maxLength={1000}
                                    placeholder="Jl. Industri Raya No. 12, Surabaya"
                                    className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-[color,box-shadow] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
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
                                {editingSupplier
                                    ? 'Simpan Perubahan'
                                    : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(supplierToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setSupplierToDelete(null);
                    }
                }}
                title="Hapus supplier?"
                description={
                    supplierToDelete
                        ? `Supplier "${supplierToDelete.name}" akan dihapus permanen. Supplier yang sudah memiliki riwayat penerimaan barang tidak dapat dihapus.`
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

SuppliersIndex.layout = {
    breadcrumbs: [
        { title: 'Master Data' },
        { title: 'Supplier', href: index() },
    ],
};
