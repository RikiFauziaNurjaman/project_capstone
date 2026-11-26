import { Head, Link, router, useForm } from '@inertiajs/react';
import {
    AlertTriangle,
    Box,
    MoreHorizontal,
    PackageCheck,
    PackageX,
    Pencil,
    Plus,
    Trash2,
    X,
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
import InputError from '@/components/input-error';
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
import { index as categoriesIndex } from '@/routes/master/categories';
import { destroy, index, store, update } from '@/routes/master/items';
import { index as unitsIndex } from '@/routes/master/units';
import type {
    CategoryOption,
    ItemRecord,
    ItemStats,
    UnitOption,
} from '@/types';

type SpecEntry = {
    key: string;
    value: string;
};

type ConversionEntry = {
    unit_id: string;
    factor: string;
};

type ItemFormData = {
    sku: string;
    name: string;
    category_id: string;
    unit_id: string;
    stock_qty: string;
    min_stock: string;
    avg_cost: string;
    is_active: boolean;
    specs: SpecEntry[];
    conversions: ConversionEntry[];
};

type Props = {
    items: LaravelPaginator<ItemRecord>;
    stats: ItemStats;
    categories: CategoryOption[];
    units: UnitOption[];
    filters: {
        search: string;
        category_id: string;
        status: string;
        stock_status: string;
        sort_by: string;
        sort_direction: SortDirection;
        per_page: number;
    };
};

const STOCK_STATUS_OPTIONS = [
    { value: 'available', label: 'Tersedia Normal' },
    { value: 'low', label: 'Stok Menipis' },
    { value: 'out', label: 'Stok Habis' },
];

const ACTIVE_STATUS_OPTIONS = [
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Nonaktif' },
];

function formatQty(value: string | number): string {
    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return '0';
    }

    return new Intl.NumberFormat('id-ID', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 3,
    }).format(numeric);
}

function formatCurrency(value: string | number): string {
    const numeric = Number(value);

    if (Number.isNaN(numeric)) {
        return 'Rp 0';
    }

    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(numeric);
}

function getStockBadge(item: ItemRecord): {
    label: string;
    variant: StatusBadgeVariant;
} {
    const stock = Number(item.stock_qty);
    const minStock = Number(item.min_stock);

    if (stock <= 0) {
        return { label: 'Stok Habis', variant: 'danger' };
    }

    if (stock <= minStock) {
        return { label: 'Stok Menipis', variant: 'warning' };
    }

    return { label: 'Tersedia', variant: 'success' };
}

function getEmptyFormData(): ItemFormData {
    return {
        sku: '',
        name: '',
        category_id: '',
        unit_id: '',
        stock_qty: '0',
        min_stock: '0',
        avg_cost: '0',
        is_active: true,
        specs: [],
        conversions: [],
    };
}

export default function ItemsIndex({
    items,
    stats,
    categories,
    units,
    filters,
}: Props) {
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<ItemRecord | null>(null);
    const [itemToDelete, setItemToDelete] = useState<ItemRecord | null>(null);
    const [deleting, setDeleting] = useState(false);

    const form = useForm<ItemFormData>(getEmptyFormData());
    const formErrors = form.errors as Record<string, string | undefined>;

    const applyQuery = useCallback(
        (overrides: Record<string, string | number | undefined>) => {
            const params: Record<string, string | number> = {
                search: filters.search,
                category_id: filters.category_id,
                status: filters.status,
                stock_status: filters.stock_status,
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

    const categoryOptions = useMemo(
        () =>
            categories.map((category) => ({
                value: String(category.id),
                label: category.name,
            })),
        [categories],
    );

    const baseUnit = useMemo(
        () => units.find((unit) => String(unit.id) === form.data.unit_id),
        [units, form.data.unit_id],
    );

    const conversionUnitOptions = useMemo(
        () => units.filter((unit) => String(unit.id) !== form.data.unit_id),
        [units, form.data.unit_id],
    );

    const activeFilterChips: ActiveFilterChip[] = [];
    if (filters.category_id) {
        const matched = categories.find(
            (category) => String(category.id) === filters.category_id,
        );
        activeFilterChips.push({
            key: 'category_id',
            label: 'Kategori',
            valueLabel: matched?.name ?? filters.category_id,
            onRemove: () => applyQuery({ category_id: '', page: 1 }),
        });
    }
    if (filters.stock_status) {
        const matched = STOCK_STATUS_OPTIONS.find(
            (option) => option.value === filters.stock_status,
        );
        activeFilterChips.push({
            key: 'stock_status',
            label: 'Stok',
            valueLabel: matched?.label ?? filters.stock_status,
            onRemove: () => applyQuery({ stock_status: '', page: 1 }),
        });
    }
    if (filters.status) {
        const matched = ACTIVE_STATUS_OPTIONS.find(
            (option) => option.value === filters.status,
        );
        activeFilterChips.push({
            key: 'status',
            label: 'Status',
            valueLabel: matched?.label ?? filters.status,
            onRemove: () => applyQuery({ status: '', page: 1 }),
        });
    }

    const openCreateDialog = () => {
        setEditingItem(null);
        form.clearErrors();
        form.setData(getEmptyFormData());
        setDialogOpen(true);
    };

    const openEditDialog = (item: ItemRecord) => {
        setEditingItem(item);
        form.clearErrors();
        const specsList: SpecEntry[] = item.specs
            ? Object.entries(item.specs).map(([key, value]) => ({
                  key,
                  value: String(value),
              }))
            : [];
        const conversionsList: ConversionEntry[] = (item.conversions ?? []).map(
            (conversion) => ({
                unit_id: String(conversion.unit_id),
                factor: String(Number(conversion.factor)),
            }),
        );

        form.setData({
            sku: item.sku,
            name: item.name,
            category_id: String(item.category_id),
            unit_id: String(item.unit_id),
            stock_qty: String(Number(item.stock_qty)),
            min_stock: String(Number(item.min_stock)),
            avg_cost: String(Number(item.avg_cost)),
            is_active: item.is_active,
            specs: specsList,
            conversions: conversionsList,
        });
        setDialogOpen(true);
    };

    const addSpecRow = () => {
        form.setData('specs', [...form.data.specs, { key: '', value: '' }]);
    };

    const updateSpecRow = (
        rowIndex: number,
        field: keyof SpecEntry,
        value: string,
    ) => {
        const next = form.data.specs.map((row, index) =>
            index === rowIndex ? { ...row, [field]: value } : row,
        );
        form.setData('specs', next);
    };

    const removeSpecRow = (rowIndex: number) => {
        form.setData(
            'specs',
            form.data.specs.filter((_, index) => index !== rowIndex),
        );
    };

    const addConversionRow = () => {
        form.setData('conversions', [
            ...form.data.conversions,
            { unit_id: '', factor: '1' },
        ]);
    };

    const updateConversionRow = (
        rowIndex: number,
        field: keyof ConversionEntry,
        value: string,
    ) => {
        const next = form.data.conversions.map((row, index) =>
            index === rowIndex ? { ...row, [field]: value } : row,
        );
        form.setData('conversions', next);
    };

    const removeConversionRow = (rowIndex: number) => {
        form.setData(
            'conversions',
            form.data.conversions.filter((_, index) => index !== rowIndex),
        );
    };

    const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();

        if (editingItem) {
            form.put(update.url(editingItem.id), {
                preserveScroll: true,
                onSuccess: () => {
                    setDialogOpen(false);
                    setEditingItem(null);
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
        if (!itemToDelete) {
            return;
        }

        setDeleting(true);
        router.delete(destroy.url(itemToDelete.id), {
            preserveScroll: true,
            onFinish: () => {
                setDeleting(false);
                setItemToDelete(null);
            },
        });
    };

    const columns: DataTableColumn<ItemRecord>[] = [
        {
            key: 'sku',
            header: 'SKU',
            sortable: true,
            headerClassName: 'w-32',
            cell: (row) => (
                <span className="font-mono text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {row.sku}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Nama Barang',
            sortable: true,
            cell: (row) => {
                const specEntries = row.specs ? Object.entries(row.specs) : [];

                return (
                    <div className="min-w-[200px] space-y-1">
                        <p className="font-medium text-slate-900 dark:text-slate-100">
                            {row.name}
                        </p>
                        {specEntries.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                                {specEntries.slice(0, 3).map(([key, value]) => (
                                    <span
                                        key={key}
                                        className="rounded border border-border bg-slate-50 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800/80 dark:text-slate-300"
                                    >
                                        {key}: {value}
                                    </span>
                                ))}
                                {specEntries.length > 3 && (
                                    <span className="text-[11px] text-muted-foreground">
                                        +{specEntries.length - 3}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                );
            },
        },
        {
            key: 'category',
            header: 'Kategori',
            cell: (row) => (
                <span className="text-slate-600 dark:text-slate-300">
                    {row.category?.name ?? '—'}
                </span>
            ),
        },
        {
            key: 'stock_qty',
            header: 'Stok',
            align: 'right',
            sortable: true,
            cell: (row) => {
                const unitCode = row.unit?.code ?? '';
                const conversions = row.conversions ?? [];

                return (
                    <div className="space-y-0.5 text-right tabular-nums">
                        <div>
                            <span className="font-semibold text-slate-900 dark:text-slate-100">
                                {formatQty(row.stock_qty)}
                            </span>{' '}
                            <span className="text-xs text-muted-foreground">
                                {unitCode}
                            </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground">
                            Min: {formatQty(row.min_stock)} {unitCode}
                            {conversions.length > 0 &&
                                ` · ${conversions.length} konversi`}
                        </p>
                    </div>
                );
            },
        },
        {
            key: 'avg_cost',
            header: 'HPP Rata-rata',
            align: 'right',
            sortable: true,
            cell: (row) => (
                <span className="font-medium text-slate-800 tabular-nums dark:text-slate-200">
                    {formatCurrency(row.avg_cost)}
                </span>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const stockBadge = getStockBadge(row);

                return (
                    <div className="flex flex-wrap items-center gap-1.5">
                        <StatusBadge variant={stockBadge.variant}>
                            {stockBadge.label}
                        </StatusBadge>
                        {!row.is_active && (
                            <StatusBadge variant="neutral" dot={false}>
                                Nonaktif
                            </StatusBadge>
                        )}
                    </div>
                );
            },
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
                            Ubah barang
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setItemToDelete(row)}
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

    const hasFilters = Boolean(
        filters.search ||
        filters.category_id ||
        filters.stock_status ||
        filters.status,
    );

    const missingMasterPrerequisites =
        categories.length === 0 || units.length === 0;

    return (
        <>
            <Head title="Master Barang & Inventaris" />

            <PageContainer>
                <PageHeader
                    title="Master Barang & Inventaris"
                    description="Kelola katalog SKU, satuan dasar, konversi satuan, spesifikasi teknis, dan batas stok minimum."
                    badge={stats.total}
                    actions={
                        <Button
                            type="button"
                            size="sm"
                            onClick={openCreateDialog}
                            className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                        >
                            <Plus className="size-4" />
                            Tambah Barang
                        </Button>
                    }
                />

                {missingMasterPrerequisites && (
                    <div className="flex flex-col justify-between gap-2 rounded-xl border border-amber-200/90 bg-amber-50/70 px-4 py-3 text-xs text-amber-900 sm:flex-row sm:items-center dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-200">
                        <p>
                            Lengkapi{' '}
                            {categories.length === 0 && (
                                <Link
                                    href={categoriesIndex()}
                                    className="font-semibold underline underline-offset-2"
                                >
                                    Master Kategori
                                </Link>
                            )}
                            {categories.length === 0 &&
                                units.length === 0 &&
                                ' dan '}
                            {units.length === 0 && (
                                <Link
                                    href={unitsIndex()}
                                    className="font-semibold underline underline-offset-2"
                                >
                                    Master Satuan
                                </Link>
                            )}{' '}
                            terlebih dahulu sebelum menambahkan barang baru.
                        </p>
                    </div>
                )}

                <StatCardGrid columns={4}>
                    <StatCard
                        label="Total SKU Terdaftar"
                        value={stats.total}
                        icon={Box}
                        tone="brand"
                        helper="seluruh item master"
                    />
                    <StatCard
                        label="Barang Aktif"
                        value={stats.active}
                        icon={PackageCheck}
                        tone="success"
                        helper="siap digunakan transaksi"
                    />
                    <StatCard
                        label="Stok Menipis"
                        value={stats.low_stock}
                        icon={AlertTriangle}
                        tone="warning"
                        helper="stok ≤ batas minimum"
                    />
                    <StatCard
                        label="Stok Habis"
                        value={stats.out_of_stock}
                        icon={PackageX}
                        tone="danger"
                        helper="perlu pengadaan ulang"
                    />
                </StatCardGrid>

                <DataTable
                    columns={columns}
                    data={items.data}
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
                                    category_id: '',
                                    stock_status: '',
                                    status: '',
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
                                placeholder="Cari SKU, nama barang, atau kategori..."
                            />
                            <FilterSelect
                                value={filters.category_id}
                                onValueChange={(value) =>
                                    applyQuery({ category_id: value, page: 1 })
                                }
                                options={categoryOptions}
                                placeholder="Semua kategori"
                                allLabel="Semua kategori"
                            />
                            <FilterSelect
                                value={filters.stock_status}
                                onValueChange={(value) =>
                                    applyQuery({
                                        stock_status: value,
                                        page: 1,
                                    })
                                }
                                options={STOCK_STATUS_OPTIONS}
                                placeholder="Semua kondisi stok"
                                allLabel="Semua kondisi stok"
                            />
                            <FilterSelect
                                value={filters.status}
                                onValueChange={(value) =>
                                    applyQuery({ status: value, page: 1 })
                                }
                                options={ACTIVE_STATUS_OPTIONS}
                                placeholder="Semua status"
                                allLabel="Semua status"
                            />
                        </FilterBar>
                    }
                    footer={
                        <Pagination
                            paginator={items}
                            onPerPageChange={(perPage) =>
                                applyQuery({ per_page: perPage, page: 1 })
                            }
                            itemLabel="barang"
                        />
                    }
                    emptyState={{
                        icon: Box,
                        title: hasFilters
                            ? 'Barang tidak ditemukan'
                            : 'Belum ada data barang',
                        description: hasFilters
                            ? 'Coba ubah kata kunci pencarian atau reset filter yang aktif.'
                            : 'Tambahkan barang inventaris pertama beserta satuan dasar dan stok minimumnya.',
                        action: hasFilters ? (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                    applyQuery({
                                        search: '',
                                        category_id: '',
                                        stock_status: '',
                                        status: '',
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
                                Tambah Barang Pertama
                            </Button>
                        ),
                    }}
                />
            </PageContainer>

            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[680px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle className="text-base font-semibold tracking-tight">
                                {editingItem
                                    ? 'Ubah Data Barang'
                                    : 'Tambah Barang Baru'}
                            </DialogTitle>
                            <DialogDescription className="text-[13px]">
                                Lengkapi informasi SKU, satuan dasar, stok,
                                spesifikasi teknis, dan konversi satuan bila
                                diperlukan.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="grid gap-5 py-4">
                            {/* Core info */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                                <FormField
                                    label="Kode SKU"
                                    htmlFor="item-sku"
                                    required
                                    error={formErrors.sku}
                                >
                                    <Input
                                        id="item-sku"
                                        value={form.data.sku}
                                        onChange={(event) =>
                                            form.setData(
                                                'sku',
                                                event.target.value.toUpperCase(),
                                            )
                                        }
                                        maxLength={50}
                                        placeholder="ACR-001"
                                        required
                                        className="font-mono uppercase"
                                    />
                                </FormField>

                                <FormField
                                    label="Nama Barang"
                                    htmlFor="item-name"
                                    required
                                    error={formErrors.name}
                                >
                                    <Input
                                        id="item-name"
                                        value={form.data.name}
                                        onChange={(event) =>
                                            form.setData(
                                                'name',
                                                event.target.value,
                                            )
                                        }
                                        maxLength={150}
                                        placeholder="Akrilik Susu 3mm (122x244cm)"
                                        required
                                    />
                                </FormField>

                                <FormField
                                    label="Kategori"
                                    htmlFor="item-category"
                                    required
                                    error={formErrors.category_id}
                                >
                                    <Select
                                        value={
                                            form.data.category_id || undefined
                                        }
                                        onValueChange={(value) =>
                                            form.setData('category_id', value)
                                        }
                                    >
                                        <SelectTrigger
                                            id="item-category"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih kategori" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {categories.map((category) => (
                                                <SelectItem
                                                    key={category.id}
                                                    value={String(category.id)}
                                                >
                                                    {category.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>

                                <FormField
                                    label="Satuan Dasar"
                                    htmlFor="item-unit"
                                    required
                                    error={formErrors.unit_id}
                                >
                                    <Select
                                        value={form.data.unit_id || undefined}
                                        onValueChange={(value) =>
                                            form.setData('unit_id', value)
                                        }
                                    >
                                        <SelectTrigger
                                            id="item-unit"
                                            className="w-full"
                                        >
                                            <SelectValue placeholder="Pilih satuan dasar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {units.map((unit) => (
                                                <SelectItem
                                                    key={unit.id}
                                                    value={String(unit.id)}
                                                >
                                                    {unit.code} — {unit.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </FormField>
                            </div>

                            {/* Stock & cost */}
                            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                                <FormField
                                    label={
                                        editingItem
                                            ? 'Stok Saat Ini'
                                            : 'Stok Awal'
                                    }
                                    htmlFor="item-stock-qty"
                                    required
                                    error={formErrors.stock_qty}
                                >
                                    <Input
                                        id="item-stock-qty"
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={form.data.stock_qty}
                                        onChange={(event) =>
                                            form.setData(
                                                'stock_qty',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="tabular-nums"
                                    />
                                </FormField>

                                <FormField
                                    label="Stok Minimum"
                                    htmlFor="item-min-stock"
                                    required
                                    error={formErrors.min_stock}
                                >
                                    <Input
                                        id="item-min-stock"
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={form.data.min_stock}
                                        onChange={(event) =>
                                            form.setData(
                                                'min_stock',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="tabular-nums"
                                    />
                                </FormField>

                                <FormField
                                    label="HPP Rata-rata (Rp)"
                                    htmlFor="item-avg-cost"
                                    required
                                    error={formErrors.avg_cost}
                                >
                                    <Input
                                        id="item-avg-cost"
                                        type="number"
                                        step="any"
                                        min="0"
                                        value={form.data.avg_cost}
                                        onChange={(event) =>
                                            form.setData(
                                                'avg_cost',
                                                event.target.value,
                                            )
                                        }
                                        required
                                        className="tabular-nums"
                                    />
                                </FormField>
                            </div>

                            {/* Active toggle */}
                            <div className="flex items-center gap-2.5 rounded-lg border border-border bg-slate-50/60 px-3.5 py-2.5 dark:bg-slate-900/40">
                                <Checkbox
                                    id="item-is-active"
                                    checked={form.data.is_active}
                                    onCheckedChange={(checked) =>
                                        form.setData(
                                            'is_active',
                                            checked === true,
                                        )
                                    }
                                />
                                <Label
                                    htmlFor="item-is-active"
                                    className="cursor-pointer text-[13px] font-medium text-slate-700 dark:text-slate-200"
                                >
                                    Barang aktif dan tersedia untuk transaksi
                                </Label>
                            </div>

                            {/* Dynamic Specs */}
                            <div className="space-y-2.5 border-t border-border pt-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                            Spesifikasi Teknis (Opsional)
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Contoh: Ketebalan = 3mm, Warna =
                                            Putih Susu, Tegangan = 12V.
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addSpecRow}
                                        className="h-8 cursor-pointer text-xs"
                                    >
                                        <Plus className="size-3.5" />
                                        Tambah
                                    </Button>
                                </div>

                                {form.data.specs.length > 0 && (
                                    <div className="space-y-2">
                                        {form.data.specs.map(
                                            (spec, rowIndex) => (
                                                <div
                                                    key={rowIndex}
                                                    className="grid grid-cols-[1fr_1fr_auto] items-start gap-2"
                                                >
                                                    <div>
                                                        <Input
                                                            value={spec.key}
                                                            onChange={(event) =>
                                                                updateSpecRow(
                                                                    rowIndex,
                                                                    'key',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Nama atribut"
                                                            className="h-8 text-xs"
                                                        />
                                                        <InputError
                                                            message={
                                                                formErrors[
                                                                    `specs.${rowIndex}.key`
                                                                ]
                                                            }
                                                            className="mt-1 text-xs"
                                                        />
                                                    </div>
                                                    <div>
                                                        <Input
                                                            value={spec.value}
                                                            onChange={(event) =>
                                                                updateSpecRow(
                                                                    rowIndex,
                                                                    'value',
                                                                    event.target
                                                                        .value,
                                                                )
                                                            }
                                                            placeholder="Nilai spesifikasi"
                                                            className="h-8 text-xs"
                                                        />
                                                        <InputError
                                                            message={
                                                                formErrors[
                                                                    `specs.${rowIndex}.value`
                                                                ]
                                                            }
                                                            className="mt-1 text-xs"
                                                        />
                                                    </div>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            removeSpecRow(
                                                                rowIndex,
                                                            )
                                                        }
                                                        aria-label="Hapus spesifikasi"
                                                        className="size-8 cursor-pointer text-slate-400 hover:text-destructive"
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* Dynamic Unit Conversions */}
                            <div className="space-y-2.5 border-t border-border pt-4">
                                <div className="flex items-center justify-between gap-2">
                                    <div>
                                        <h3 className="text-[13px] font-semibold text-slate-800 dark:text-slate-100">
                                            Konversi Satuan (Opsional)
                                        </h3>
                                        <p className="text-xs text-muted-foreground">
                                            Tentukan rasio satuan alternatif ke
                                            satuan dasar{' '}
                                            {baseUnit ? (
                                                <span className="font-semibold text-foreground">
                                                    ({baseUnit.code})
                                                </span>
                                            ) : (
                                                '(pilih satuan dasar dulu)'
                                            )}
                                            .
                                        </p>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addConversionRow}
                                        disabled={
                                            conversionUnitOptions.length === 0
                                        }
                                        className="h-8 cursor-pointer text-xs"
                                    >
                                        <Plus className="size-3.5" />
                                        Tambah Konversi
                                    </Button>
                                </div>

                                {form.data.conversions.length > 0 && (
                                    <div className="space-y-2">
                                        {form.data.conversions.map(
                                            (conversion, rowIndex) => (
                                                <div
                                                    key={rowIndex}
                                                    className="grid grid-cols-1 items-start gap-2 rounded-lg border border-border/80 bg-slate-50/50 p-2.5 sm:grid-cols-[1fr_140px_auto] dark:bg-slate-900/30"
                                                >
                                                    <div>
                                                        <Select
                                                            value={
                                                                conversion.unit_id ||
                                                                undefined
                                                            }
                                                            onValueChange={(
                                                                value,
                                                            ) =>
                                                                updateConversionRow(
                                                                    rowIndex,
                                                                    'unit_id',
                                                                    value,
                                                                )
                                                            }
                                                        >
                                                            <SelectTrigger className="h-8 w-full bg-white text-xs dark:bg-slate-900">
                                                                <SelectValue placeholder="Pilih satuan konversi" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {conversionUnitOptions.map(
                                                                    (unit) => (
                                                                        <SelectItem
                                                                            key={
                                                                                unit.id
                                                                            }
                                                                            value={String(
                                                                                unit.id,
                                                                            )}
                                                                        >
                                                                            {
                                                                                unit.code
                                                                            }{' '}
                                                                            —{' '}
                                                                            {
                                                                                unit.name
                                                                            }
                                                                        </SelectItem>
                                                                    ),
                                                                )}
                                                            </SelectContent>
                                                        </Select>
                                                        <InputError
                                                            message={
                                                                formErrors[
                                                                    `conversions.${rowIndex}.unit_id`
                                                                ]
                                                            }
                                                            className="mt-1 text-xs"
                                                        />
                                                    </div>

                                                    <div>
                                                        <div className="relative">
                                                            <Input
                                                                type="number"
                                                                step="any"
                                                                min="0.0001"
                                                                value={
                                                                    conversion.factor
                                                                }
                                                                onChange={(
                                                                    event,
                                                                ) =>
                                                                    updateConversionRow(
                                                                        rowIndex,
                                                                        'factor',
                                                                        event
                                                                            .target
                                                                            .value,
                                                                    )
                                                                }
                                                                placeholder="Faktor"
                                                                className="h-8 bg-white pr-12 text-xs tabular-nums dark:bg-slate-900"
                                                            />
                                                            {baseUnit && (
                                                                <span className="pointer-events-none absolute top-1/2 right-2.5 -translate-y-1/2 font-mono text-[10px] font-medium text-muted-foreground">
                                                                    {
                                                                        baseUnit.code
                                                                    }
                                                                </span>
                                                            )}
                                                        </div>
                                                        <InputError
                                                            message={
                                                                formErrors[
                                                                    `conversions.${rowIndex}.factor`
                                                                ]
                                                            }
                                                            className="mt-1 text-xs"
                                                        />
                                                    </div>

                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() =>
                                                            removeConversionRow(
                                                                rowIndex,
                                                            )
                                                        }
                                                        aria-label="Hapus konversi satuan"
                                                        className="size-8 cursor-pointer text-slate-400 hover:text-destructive"
                                                    >
                                                        <X className="size-4" />
                                                    </Button>
                                                </div>
                                            ),
                                        )}
                                    </div>
                                )}
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
                                {editingItem ? 'Simpan Perubahan' : 'Simpan'}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <ConfirmDialog
                open={Boolean(itemToDelete)}
                onOpenChange={(open) => {
                    if (!open) {
                        setItemToDelete(null);
                    }
                }}
                title="Hapus data barang?"
                description={
                    itemToDelete
                        ? `Barang "${itemToDelete.name}" (${itemToDelete.sku}) akan dihapus permanen. Barang yang sudah memiliki riwayat mutasi stok tidak dapat dihapus.`
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

ItemsIndex.layout = {
    breadcrumbs: [{ title: 'Inventaris', href: index() }],
};
