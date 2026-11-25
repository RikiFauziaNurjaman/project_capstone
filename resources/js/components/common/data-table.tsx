import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import type { ReactNode } from 'react';
import { EmptyState } from '@/components/common/empty-state';
import type { EmptyStateProps } from '@/components/common/empty-state';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

export type SortDirection = 'asc' | 'desc';

export type DataTableColumn<TData> = {
    key: string;
    header: ReactNode;
    accessor?: keyof TData;
    cell?: (row: TData, index: number) => ReactNode;
    align?: 'left' | 'center' | 'right';
    sortable?: boolean;
    className?: string;
    headerClassName?: string;
};

export type DataTableProps<TData> = {
    columns: DataTableColumn<TData>[];
    data: TData[];
    rowKey: (row: TData, index: number) => string | number;
    loading?: boolean;
    skeletonRows?: number;
    sortBy?: string;
    sortDirection?: SortDirection;
    onSort?: (columnKey: string, direction: SortDirection) => void;
    selectable?: boolean;
    selectedRowKeys?: Array<string | number>;
    onSelectionChange?: (selectedKeys: Array<string | number>) => void;
    onRowClick?: (row: TData) => void;
    dense?: boolean;
    bordered?: boolean;
    toolbar?: ReactNode;
    footer?: ReactNode;
    emptyState?: EmptyStateProps;
    className?: string;
};

const alignClasses = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
};

export function DataTable<TData>({
    columns,
    data,
    rowKey,
    loading = false,
    skeletonRows = 5,
    sortBy,
    sortDirection = 'asc',
    onSort,
    selectable = false,
    selectedRowKeys = [],
    onSelectionChange,
    onRowClick,
    dense = false,
    bordered = true,
    toolbar,
    footer,
    emptyState,
    className,
}: DataTableProps<TData>) {
    const visibleRowKeys = data.map((row, index) => rowKey(row, index));
    const selectedSet = new Set(selectedRowKeys);
    const allSelected =
        visibleRowKeys.length > 0 &&
        visibleRowKeys.every((key) => selectedSet.has(key));
    const someSelected =
        !allSelected && visibleRowKeys.some((key) => selectedSet.has(key));

    const handleToggleAll = (checked: boolean | 'indeterminate') => {
        if (!onSelectionChange) {
            return;
        }

        if (checked === true) {
            const merged = new Set([...selectedRowKeys, ...visibleRowKeys]);
            onSelectionChange(Array.from(merged));
        } else {
            const visibleSet = new Set(visibleRowKeys);
            onSelectionChange(
                selectedRowKeys.filter((key) => !visibleSet.has(key)),
            );
        }
    };

    const handleToggleRow = (key: string | number, checked: boolean) => {
        if (!onSelectionChange) {
            return;
        }

        if (checked) {
            onSelectionChange([...selectedRowKeys, key]);
        } else {
            onSelectionChange(selectedRowKeys.filter((item) => item !== key));
        }
    };

    const handleSortClick = (columnKey: string) => {
        if (!onSort) {
            return;
        }

        const nextDirection: SortDirection =
            sortBy === columnKey && sortDirection === 'asc' ? 'desc' : 'asc';
        onSort(columnKey, nextDirection);
    };

    const totalColumnCount = columns.length + (selectable ? 1 : 0);

    return (
        <div
            className={cn(
                'overflow-hidden bg-card',
                bordered && 'rounded-xl border border-border',
                className,
            )}
        >
            {toolbar && (
                <div className="border-b border-border px-4 py-3.5 sm:px-5">
                    {toolbar}
                </div>
            )}

            <Table>
                <TableHeader>
                    <TableRow className="hover:bg-transparent">
                        {selectable && (
                            <TableHead className="w-10">
                                <Checkbox
                                    checked={
                                        allSelected
                                            ? true
                                            : someSelected
                                              ? 'indeterminate'
                                              : false
                                    }
                                    onCheckedChange={handleToggleAll}
                                    aria-label="Pilih semua baris"
                                />
                            </TableHead>
                        )}
                        {columns.map((column) => {
                            const align = column.align ?? 'left';
                            const isSorted = sortBy === column.key;

                            return (
                                <TableHead
                                    key={column.key}
                                    className={cn(
                                        alignClasses[align],
                                        column.headerClassName,
                                    )}
                                >
                                    {column.sortable && onSort ? (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                handleSortClick(column.key)
                                            }
                                            className={cn(
                                                'inline-flex cursor-pointer items-center gap-1.5 uppercase transition-colors hover:text-slate-800 dark:hover:text-slate-100',
                                                align === 'right' &&
                                                    'ml-auto flex-row-reverse',
                                                align === 'center' && 'mx-auto',
                                                isSorted &&
                                                    'text-slate-800 dark:text-slate-100',
                                            )}
                                        >
                                            <span>{column.header}</span>
                                            {isSorted ? (
                                                sortDirection === 'asc' ? (
                                                    <ArrowUp className="size-3.5 text-brand" />
                                                ) : (
                                                    <ArrowDown className="size-3.5 text-brand" />
                                                )
                                            ) : (
                                                <ArrowUpDown className="size-3.5 text-slate-400" />
                                            )}
                                        </button>
                                    ) : (
                                        column.header
                                    )}
                                </TableHead>
                            );
                        })}
                    </TableRow>
                </TableHeader>

                <TableBody>
                    {loading ? (
                        Array.from({ length: skeletonRows }).map(
                            (_, rowIndex) => (
                                <TableRow
                                    key={`skeleton-${rowIndex}`}
                                    className="hover:bg-transparent"
                                >
                                    {selectable && (
                                        <TableCell
                                            className={cn(dense && 'py-2')}
                                        >
                                            <Skeleton className="size-4 rounded" />
                                        </TableCell>
                                    )}
                                    {columns.map((column) => (
                                        <TableCell
                                            key={column.key}
                                            className={cn(
                                                dense && 'py-2',
                                                column.className,
                                            )}
                                        >
                                            <Skeleton className="h-4 w-full max-w-[160px]" />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ),
                        )
                    ) : data.length === 0 ? (
                        <TableRow className="hover:bg-transparent">
                            <TableCell
                                colSpan={totalColumnCount}
                                className="p-0"
                            >
                                <EmptyState {...emptyState} />
                            </TableCell>
                        </TableRow>
                    ) : (
                        data.map((row, rowIndex) => {
                            const key = rowKey(row, rowIndex);
                            const isSelected = selectedSet.has(key);

                            return (
                                <TableRow
                                    key={key}
                                    data-state={
                                        isSelected ? 'selected' : undefined
                                    }
                                    onClick={
                                        onRowClick
                                            ? () => onRowClick(row)
                                            : undefined
                                    }
                                    className={cn(
                                        onRowClick && 'cursor-pointer',
                                    )}
                                >
                                    {selectable && (
                                        <TableCell
                                            onClick={(event) =>
                                                event.stopPropagation()
                                            }
                                            className={cn(dense && 'py-2')}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) =>
                                                    handleToggleRow(
                                                        key,
                                                        checked === true,
                                                    )
                                                }
                                                aria-label={`Pilih baris ${rowIndex + 1}`}
                                            />
                                        </TableCell>
                                    )}
                                    {columns.map((column) => {
                                        const align = column.align ?? 'left';
                                        const cellValue = column.cell
                                            ? column.cell(row, rowIndex)
                                            : column.accessor
                                              ? (row[
                                                    column.accessor
                                                ] as ReactNode)
                                              : null;

                                        return (
                                            <TableCell
                                                key={column.key}
                                                className={cn(
                                                    alignClasses[align],
                                                    dense && 'py-2',
                                                    column.className,
                                                )}
                                            >
                                                {cellValue}
                                            </TableCell>
                                        );
                                    })}
                                </TableRow>
                            );
                        })
                    )}
                </TableBody>
            </Table>

            {footer && (
                <div className="border-t border-border bg-slate-50/40 px-4 py-3 sm:px-5 dark:bg-slate-900/30">
                    {footer}
                </div>
            )}
        </div>
    );
}
