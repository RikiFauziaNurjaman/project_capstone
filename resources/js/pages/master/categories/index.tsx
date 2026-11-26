import { Head, router, useForm } from '@inertiajs/react';
import { MoreHorizontal, Pencil, Plus, Tags, Trash2 } from 'lucide-react';
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
    StatusBadge,
} from '@/components/common';
import type {
    ActiveFilterChip,
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
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { destroy, index, store, update } from '@/routes/master/categories';
import type { CategoryOption, CategoryRecord } from '@/types';

type Props = {
    categories: LaravelPaginator<CategoryRecord>;
    parentOptions: CategoryOption[];
    filters: {
        search: string;
        parent_id: string;
        sort_by: string;
        sort_direction: SortDirection;
        per_page: number;
    };
};

const NO_PARENT_VALUE = '__none__';

function formatDate(dateString: string): string {
    return new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(dateString));
}

export default function CategoriesIndex({
    categories,
    parentOptions,
    filters,
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingCategory, setEditingCategory] =
        useState<CategoryRecord | null>(null);
    const [categoryToDelete, setCategoryToDelete] =
        useState<CategoryRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm({
        name: '',
        parent_id: '' as string,
    });

    const applyQuery = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number> = {
                search: filters.search,
                parent_id: filters.parent_id,
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

    const filterParentSelectOptions = useMemo(
        () => [
            { value: 'root', label: 'Hanya kategori utama' },
            ...parentOptions.map((option) => ({
                value: String(option.id),
                label: `Sub dari: ${option.name}`,
            })),
        ],
        [parentOptions],
    );

    const availableFormParents = useMemo(
        () =>
            parentOptions.filter(
                (option) =>
                    !editingCategory || option.id !== editingCategory.id,
            ),
        [parentOptions, editingCategory],
    );

    const activeFilterChips: ActiveFilterChip[] = [];
    if (filters.parent_id) {
        const matchedLabel =
            filters.parent_id === 'root'
                ? 'Hanya kategori utama'
                : (parentOptions.find(
                      (option) => String(option.id) === filters.parent_id,
                  )?.name ?? filters.parent_id);

        activeFilterChips.push({
            key: 'parent_id',
            label: 'Hierarki',
            valueLabel: matchedLabel,
            onRemove: () => applyQuery({ parent_id: '', page: 1 }),
        });
    }

    const openCreateDialog = () => {
        setEditingCategory(null);
        form.clearErrors();
        form.setData({ name: '', parent_id: '' });
        setDialogOpen(true);
    };

    const openEditDialog = (category: CategoryRecord) => {
        setEditingCategory(category);
        form.clearErrors();
        form.setData({
            name: category.name,
            parent_id: category.parent_id ? String(category.parent_id) : '',
        });
        setDialogOpen(true);
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingCategory) {
            form.put(update.url(editingCategory.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingCategory(null);
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
        if (!categoryToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(categoryToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setCategoryToDelete(null);
            },
        });
    };

    const columns: DataTableColumn<CategoryRecord>[] = [
        {
            key: 'name',
            header: 'Nama Kategori',
            sortable: true,
            cell: (row) => (
                <span className="font-medium text-slate-900 dark:text-slate-100">
                    {row.name}
                </span>
            ),
        },
        {
            key: 'parent',
            header: 'Kategori Induk',
            cell: (row) =>
                row.parent ? (
                    <span className="text-slate-600 dark:text-slate-300">
                        {row.parent.name}
                    </span>
                ) : (
                    <StatusBadge variant="neutral" dot={false}>
                        Kategori Utama
                    </StatusBadge>
                ),
        },
        {
            key: 'children_count',
            header: 'Sub-kategori',
            align: 'right',
            cell: (row) => (
                <span className="text-xs text-muted-foreground tabular-nums">
                    {row.children_count ?? 0}
                </span>
            ),
        },
        {
            key: 'items_count',
            header: 'Jumlah Barang',
            align: 'right',
            cell: (row) => (
                <span className="font-medium text-slate-800 tabular-nums dark:text-slate-200">
                    {row.items_count ?? 0}
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
                            Ubah kategori
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setCategoryToDelete(row)}
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
            <Head title="Master Kategori" />

            <PageContainer>
                <PageHeader
                    title="Master Kategori"
                    description="Kelompokkan material dan peralatan inventaris ke dalam kategori utama maupun sub-kategori."
                    badge={categories.total}
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            onClick={openCreateDialog}
                            className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                        >
                            <Plus className="size-4" />
                            Tambah Kategori
                        </Button>
                    }
                />

                <DataTable
                    columns={columns}
                    data={categories.data}
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
                            hasActiveFilters={Boolean(
                                filters.search || filters.parent_id,
                            )}
                            onResetFilters={() =>
                                applyQuery({
                                    search: '',
                                    parent_id: '',
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
                                placeholder="Cari nama kategori atau induk..."
                            />
                            <FilterSelect
                                value={filters.parent_id}
                                onValueChange={(value) =>
                                    applyQuery({ parent_id: value, page: 1 })
                                }
                                options={filterParentSelectOptions}
                                placeholder="Semua hierarki"
                                allLabel="Semua hierarki"
                            />
                        </FilterBar>
                    }
                    footer={
                        <Pagination
                            paginator={categories}
                            onPerPageChange={(perPage) =>
                                applyQuery({ per_page: perPage, page: 1 })
                            }
                            itemLabel="kategori"
                        />
                    }
                    emptyState={{
                        icon: Tags,
                        title:
                            filters.search || filters.parent_id
                                ? 'Kategori tidak ditemukan'
                                : 'Belum ada data kategori',
                        description:
                            filters.search || filters.parent_id
                                ? 'Ubah kata kunci pencarian atau reset filter hierarki.'
                                : 'Buat kategori seperti Material Utama, Kelistrikan, atau Finishing untuk merapikan katalog barang.',
                        action:
                            filters.search || filters.parent_id ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        applyQuery({
                                            search: '',
                                            parent_id: '',
                                            page: 1,
                                        })
                                    }
                                    className="cursor-pointer"
                                >
                                    Reset Filter
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    size="sm"
                                    onClick={openCreateDialog}
                                    className="cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                                >
                                    <Plus className="size-4" />
                                    Tambah Kategori Pertama
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
                                {editingCategory
                                    ? 'Ubah Kategori'
                                    : 'Tambah Kategori Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Kosongkan kategori induk jika ingin membuat
                                kategori utama.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-4 py-4">
                            <FormField
                                label="Nama Kategori"
                                htmlFor="category-name"
                                required
                                error={form.errors.name}
                            >
                                <Input
                                    id="category-name"
                                    value={form.data.name}
                                    onChange={(event) =>
                                        form.setData('name', event.target.value)
                                    }
                                    maxLength={100}
                                    placeholder="Contoh: Material Utama, Akrilik"
                                    required
                                />
                            </FormField>

                            <FormField
                                label="Kategori Induk"
                                htmlFor="category-parent"
                                hint="Opsional — pilih induk untuk menjadikan sub-kategori."
                                error={form.errors.parent_id}
                            >
                                <Select
                                    value={
                                        form.data.parent_id || NO_PARENT_VALUE
                                    }
                                    onValueChange={(value) =>
                                        form.setData(
                                            'parent_id',
                                            value === NO_PARENT_VALUE
                                                ? ''
                                                : value,
                                        )
                                    }
                                >
                                    <SelectTrigger
                                        id="category-parent"
                                        className="w-full"
                                    >
                                        <SelectValue placeholder="Tanpa induk (Kategori Utama)" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={NO_PARENT_VALUE}>
                                            Tanpa induk (Kategori Utama)
                                        </SelectItem>
                                        {availableFormParents.map((option) => (
                                            <SelectItem
                                                key={option.id}
                                                value={String(option.id)}
                                            >
                                                {option.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
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
                                {editingCategory
                                    ? 'Simpan Perubahan'
                                    : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(categoryToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setCategoryToDelete(null);
                    }
                }}
                title="Hapus kategori?"
                description={
                    categoryToDelete
                        ? `Kategori "${categoryToDelete.name}" akan dihapus permanen. Sub-kategori di bawahnya (jika ada) akan menjadi kategori utama.`
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

CategoriesIndex.layout = {
    breadcrumbs: [
        { title: 'Master Data' },
        { title: 'Kategori', href: index() },
    ],
};
