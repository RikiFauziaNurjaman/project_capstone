export type UnitRecord = {
    id: number;
    code: string;
    name: string;
    items_count?: number;
    conversions_count?: number;
    created_at: string;
    updated_at: string;
};

export type UnitOption = {
    id: number;
    code: string;
    name: string;
};

export type CategoryOption = {
    id: number;
    name: string;
    parent_id: number | null;
};

export type CategoryRecord = {
    id: number;
    name: string;
    parent_id: number | null;
    parent?: {
        id: number;
        name: string;
    } | null;
    items_count?: number;
    children_count?: number;
    created_at: string;
    updated_at: string;
};

export type SupplierRecord = {
    id: number;
    name: string;
    phone: string | null;
    address: string | null;
    goods_receipts_count?: number;
    created_at: string;
    updated_at: string;
};

export type ItemConversionRecord = {
    id: number;
    item_id: number;
    unit_id: number;
    factor: string;
    unit?: UnitOption | null;
};

export type ItemRecord = {
    id: number;
    sku: string;
    name: string;
    category_id: number;
    unit_id: number;
    stock_qty: string;
    min_stock: string;
    avg_cost: string;
    specs: Record<string, string> | null;
    is_active: boolean;
    category?: {
        id: number;
        name: string;
    } | null;
    unit?: UnitOption | null;
    conversions?: ItemConversionRecord[];
    created_at: string;
    updated_at: string;
};

export type ItemStats = {
    total: number;
    active: number;
    low_stock: number;
    out_of_stock: number;
};
