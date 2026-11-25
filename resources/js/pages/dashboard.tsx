import { Head } from '@inertiajs/react';
import {
    AlertTriangle,
    ArrowDownUp,
    Box,
    Download,
    MoreHorizontal,
    PackageCheck,
    Plus,
    Trash2,
    Wrench,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import {
    ConfirmDialog,
    DataTable,
    FilterBar,
    FilterSelect,
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
    SortDirection,
    StatusBadgeVariant,
} from '@/components/common';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { dashboard } from '@/routes';

type InventoryStatus = 'tersedia' | 'menipis' | 'habis' | 'perawatan';

type InventoryRow = {
    id: number;
    sku: string;
    name: string;
    category: string;
    location: string;
    stock: number;
    minStock: number;
    unit: string;
    status: InventoryStatus;
    updatedAt: string;
};

const INITIAL_ITEMS: InventoryRow[] = [
    {
        id: 1,
        sku: 'ACR-001',
        name: 'Akrilik Susu 3mm (122x244cm)',
        category: 'Material Utama',
        location: 'Gudang Utama · Rak A1',
        stock: 48,
        minStock: 15,
        unit: 'Lembar',
        status: 'tersedia',
        updatedAt: '25 Nov 2026',
    },
    {
        id: 2,
        sku: 'LED-014',
        name: 'LED Module Samsung 3 Mata 12V Putih',
        category: 'Kelistrikan',
        location: 'Gudang Utama · Rak B2',
        stock: 120,
        minStock: 200,
        unit: 'Pcs',
        status: 'menipis',
        updatedAt: '25 Nov 2026',
    },
    {
        id: 3,
        sku: 'PSU-008',
        name: 'Power Supply Rainproof 12V 400W',
        category: 'Kelistrikan',
        location: 'Gudang Utama · Rak B4',
        stock: 0,
        minStock: 10,
        unit: 'Unit',
        status: 'habis',
        updatedAt: '24 Nov 2026',
    },
    {
        id: 4,
        sku: 'ALU-021',
        name: 'Hollow Aluminium 4x4 cm (6 Meter)',
        category: 'Rangka & Profil',
        location: 'Workshop Produksi · Area C',
        stock: 64,
        minStock: 20,
        unit: 'Batang',
        status: 'tersedia',
        updatedAt: '24 Nov 2026',
    },
    {
        id: 5,
        sku: 'VNL-005',
        name: 'Stiker Vinyl Oracal 8500 Translucent',
        category: 'Finishing',
        location: 'Gudang Utama · Rak D1',
        stock: 9,
        minStock: 12,
        unit: 'Roll',
        status: 'menipis',
        updatedAt: '23 Nov 2026',
    },
    {
        id: 6,
        sku: 'TLS-019',
        name: 'Mesin Laser Cutting CO2 130W',
        category: 'Peralatan',
        location: 'Workshop Produksi · Zona 2',
        stock: 2,
        minStock: 1,
        unit: 'Unit',
        status: 'perawatan',
        updatedAt: '22 Nov 2026',
    },
    {
        id: 7,
        sku: 'ACP-011',
        name: 'Aluminium Composite Panel 4mm Hitam Doff',
        category: 'Material Utama',
        location: 'Gudang Utama · Rak A3',
        stock: 32,
        minStock: 10,
        unit: 'Lembar',
        status: 'tersedia',
        updatedAt: '22 Nov 2026',
    },
];

const STATUS_META: Record<
    InventoryStatus,
    { label: string; variant: StatusBadgeVariant }
> = {
    tersedia: { label: 'Tersedia', variant: 'success' },
    menipis: { label: 'Stok Menipis', variant: 'warning' },
    habis: { label: 'Stok Habis', variant: 'danger' },
    perawatan: { label: 'Pemeliharaan', variant: 'info' },
};

const CATEGORY_OPTIONS = [
    { value: 'Material Utama', label: 'Material Utama' },
    { value: 'Kelistrikan', label: 'Kelistrikan' },
    { value: 'Rangka & Profil', label: 'Rangka & Profil' },
    { value: 'Finishing', label: 'Finishing' },
    { value: 'Peralatan', label: 'Peralatan' },
];

const STATUS_OPTIONS = [
    { value: 'tersedia', label: 'Tersedia' },
    { value: 'menipis', label: 'Stok Menipis' },
    { value: 'habis', label: 'Stok Habis' },
    { value: 'perawatan', label: 'Pemeliharaan' },
];

export default function Dashboard() {
    const [items, setItems] = useState<InventoryRow[]>(INITIAL_ITEMS);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [status, setStatus] = useState('');
    const [sortBy, setSortBy] = useState<string>('sku');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    const [page, setPage] = useState(1);
    const [perPage, setPerPage] = useState(5);
    const [selectedKeys, setSelectedKeys] = useState<Array<string | number>>(
        [],
    );
    const [itemToDelete, setItemToDelete] = useState<InventoryRow | null>(null);

    const filteredItems = useMemo(() => {
        const query = search.trim().toLowerCase();

        const filtered = items.filter((item) => {
            const matchesSearch =
                !query ||
                item.sku.toLowerCase().includes(query) ||
                item.name.toLowerCase().includes(query) ||
                item.location.toLowerCase().includes(query);
            const matchesCategory = !category || item.category === category;
            const matchesStatus = !status || item.status === status;

            return matchesSearch && matchesCategory && matchesStatus;
        });

        return [...filtered].sort((left, right) => {
            const directionFactor = sortDirection === 'asc' ? 1 : -1;

            if (sortBy === 'stock') {
                return (left.stock - right.stock) * directionFactor;
            }

            const leftVal = String(
                left[sortBy as keyof InventoryRow] ?? '',
            ).toLowerCase();
            const rightVal = String(
                right[sortBy as keyof InventoryRow] ?? '',
            ).toLowerCase();

            return leftVal.localeCompare(rightVal) * directionFactor;
        });
    }, [items, search, category, status, sortBy, sortDirection]);

    const lastPage = Math.max(1, Math.ceil(filteredItems.length / perPage));
    const safePage = Math.min(page, lastPage);
    const paginatedItems = useMemo(() => {
        const start = (safePage - 1) * perPage;

        return filteredItems.slice(start, start + perPage);
    }, [filteredItems, safePage, perPage]);

    const activeFilterChips: ActiveFilterChip[] = [];
    if (category) {
        activeFilterChips.push({
            key: 'category',
            label: 'Kategori',
            valueLabel: category,
            onRemove: () => {
                setCategory('');
                setPage(1);
            },
        });
    }
    if (status) {
        activeFilterChips.push({
            key: 'status',
            label: 'Status',
            valueLabel: STATUS_META[status as InventoryStatus].label,
            onRemove: () => {
                setStatus('');
                setPage(1);
            },
        });
    }

    const handleResetFilters = () => {
        setSearch('');
        setCategory('');
        setStatus('');
        setPage(1);
    };

    const handleSort = (columnKey: string, direction: SortDirection) => {
        setSortBy(columnKey);
        setSortDirection(direction);
    };

    const handleDeleteConfirm = () => {
        if (!itemToDelete) {
            return;
        }

        setItems((current) =>
            current.filter((item) => item.id !== itemToDelete.id),
        );
        setSelectedKeys((current) =>
            current.filter((key) => key !== itemToDelete.id),
        );
        setItemToDelete(null);
    };

    const columns: DataTableColumn<InventoryRow>[] = [
        {
            key: 'sku',
            header: 'Kode SKU',
            sortable: true,
            cell: (row) => (
                <span className="font-mono text-xs font-medium text-slate-600 dark:text-slate-300">
                    {row.sku}
                </span>
            ),
        },
        {
            key: 'name',
            header: 'Nama Barang',
            sortable: true,
            cell: (row) => (
                <div className="min-w-[200px]">
                    <p className="font-medium text-slate-900 dark:text-slate-100">
                        {row.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                        {row.location}
                    </p>
                </div>
            ),
        },
        {
            key: 'category',
            header: 'Kategori',
            sortable: true,
            cell: (row) => (
                <span className="text-slate-600 dark:text-slate-300">
                    {row.category}
                </span>
            ),
        },
        {
            key: 'stock',
            header: 'Stok',
            align: 'right',
            sortable: true,
            cell: (row) => (
                <div className="tabular-nums">
                    <span className="font-semibold text-slate-900 dark:text-slate-100">
                        {new Intl.NumberFormat('id-ID').format(row.stock)}
                    </span>{' '}
                    <span className="text-xs text-muted-foreground">
                        {row.unit}
                    </span>
                </div>
            ),
        },
        {
            key: 'status',
            header: 'Status',
            cell: (row) => {
                const meta = STATUS_META[row.status];

                return (
                    <StatusBadge variant={meta.variant}>
                        {meta.label}
                    </StatusBadge>
                );
            },
        },
        {
            key: 'updatedAt',
            header: 'Diperbarui',
            className: 'whitespace-nowrap text-xs text-muted-foreground',
            accessor: 'updatedAt',
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
                    <DropdownMenuContent align="end" className="w-44">
                        <DropdownMenuItem className="cursor-pointer">
                            Lihat detail
                        </DropdownMenuItem>
                        <DropdownMenuItem className="cursor-pointer">
                            Catat mutasi stok
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setItemToDelete(row)}
                            className="cursor-pointer text-destructive focus:text-destructive"
                        >
                            <Trash2 className="size-4" />
                            Hapus barang
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        },
    ];

    return (
        <>
            <Head title="Ringkasan" />

            <PageContainer>
                <PageHeader
                    title="Ringkasan Inventaris"
                    description="Pantau ketersediaan stok material, kelistrikan, dan peralatan operasional di seluruh lokasi."
                    badge={1248}
                    actions={
                        <>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="h-9 cursor-pointer bg-white shadow-none dark:bg-card"
                            >
                                <Download className="size-4" />
                                Ekspor CSV
                            </Button>
                            <Button
                                type="button"
                                size="sm"
                                className="h-9 cursor-pointer bg-brand text-white hover:bg-[#e0651f]"
                            >
                                <Plus className="size-4" />
                                Tambah Barang
                            </Button>
                        </>
                    }
                />

                <StatCardGrid columns={4}>
                    <StatCard
                        label="Total SKU Terdaftar"
                        value={1248}
                        icon={Box}
                        tone="brand"
                        delta={{ label: '+24 SKU', trend: 'up' }}
                        helper="bulan ini"
                    />
                    <StatCard
                        label="Stok Tersedia Normal"
                        value={1192}
                        icon={PackageCheck}
                        tone="success"
                        helper="95,5% dari total item"
                    />
                    <StatCard
                        label="Stok Menipis / Habis"
                        value={42}
                        icon={AlertTriangle}
                        tone="warning"
                        delta={{ label: '8 item habis', trend: 'down' }}
                        helper="perlu restok"
                    />
                    <StatCard
                        label="Dalam Pemeliharaan"
                        value={14}
                        icon={Wrench}
                        tone="default"
                        helper="peralatan & mesin aktif"
                    />
                </StatCardGrid>

                <DataTable
                    columns={columns}
                    data={paginatedItems}
                    rowKey={(row) => row.id}
                    sortBy={sortBy}
                    sortDirection={sortDirection}
                    onSort={handleSort}
                    selectable
                    selectedRowKeys={selectedKeys}
                    onSelectionChange={setSelectedKeys}
                    toolbar={
                        <FilterBar
                            activeFilters={activeFilterChips}
                            onResetFilters={handleResetFilters}
                            hasActiveFilters={Boolean(
                                search || category || status,
                            )}
                            actions={
                                selectedKeys.length > 0 ? (
                                    <span className="text-xs font-medium text-slate-600 tabular-nums dark:text-slate-300">
                                        {selectedKeys.length} item dipilih
                                    </span>
                                ) : (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="h-9 cursor-pointer bg-white text-xs shadow-none dark:bg-slate-900/60"
                                    >
                                        <ArrowDownUp className="size-3.5" />
                                        Catat Mutasi
                                    </Button>
                                )
                            }
                        >
                            <SearchInput
                                value={search}
                                onChange={(value) => {
                                    setSearch(value);
                                    setPage(1);
                                }}
                                placeholder="Cari SKU, nama barang, atau lokasi..."
                            />
                            <FilterSelect
                                value={category}
                                onValueChange={(value) => {
                                    setCategory(value);
                                    setPage(1);
                                }}
                                options={CATEGORY_OPTIONS}
                                placeholder="Semua kategori"
                                allLabel="Semua kategori"
                            />
                            <FilterSelect
                                value={status}
                                onValueChange={(value) => {
                                    setStatus(value);
                                    setPage(1);
                                }}
                                options={STATUS_OPTIONS}
                                placeholder="Semua status"
                                allLabel="Semua status"
                            />
                        </FilterBar>
                    }
                    footer={
                        <Pagination
                            currentPage={safePage}
                            lastPage={lastPage}
                            perPage={perPage}
                            total={filteredItems.length}
                            onPageChange={setPage}
                            onPerPageChange={(nextPerPage) => {
                                setPerPage(nextPerPage);
                                setPage(1);
                            }}
                            perPageOptions={[5, 10, 25, 50]}
                            itemLabel="barang"
                        />
                    }
                    emptyState={{
                        title: 'Tidak ada barang ditemukan',
                        description:
                            'Coba ubah kata kunci pencarian atau reset filter kategori dan status.',
                        action: (
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={handleResetFilters}
                                className="cursor-pointer"
                            >
                                Reset Filter
                            </Button>
                        ),
                    }}
                />
            </PageContainer>

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
                        ? `Barang "${itemToDelete.name}" (${itemToDelete.sku}) akan dihapus dari daftar contoh ini.`
                        : undefined
                }
                confirmLabel="Ya, Hapus"
                variant="destructive"
                onConfirm={handleDeleteConfirm}
            />
        </>
    );
}

Dashboard.layout = {
    breadcrumbs: [
        {
            title: 'Ringkasan',
            href: dashboard(),
        },
    ],
};
