import { router } from '@inertiajs/react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type LaravelPaginationLink = {
    url: string | null;
    label: string;
    active: boolean;
};

export type LaravelPaginator<TData = unknown> = {
    data: TData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number | null;
    to: number | null;
    prev_page_url?: string | null;
    next_page_url?: string | null;
    links?: LaravelPaginationLink[];
};

export type PaginationProps = {
    paginator?: Omit<LaravelPaginator, 'data'>;
    currentPage?: number;
    lastPage?: number;
    perPage?: number;
    total?: number;
    from?: number | null;
    to?: number | null;
    onPageChange?: (page: number) => void;
    onPerPageChange?: (perPage: number) => void;
    perPageOptions?: number[];
    itemLabel?: string;
    preserveScroll?: boolean;
    preserveState?: boolean;
    className?: string;
};

function buildPageRange(
    currentPage: number,
    lastPage: number,
): Array<number | 'ellipsis'> {
    if (lastPage <= 7) {
        return Array.from({ length: lastPage }, (_, index) => index + 1);
    }

    const pages: Array<number | 'ellipsis'> = [1];
    const start = Math.max(2, currentPage - 1);
    const end = Math.min(lastPage - 1, currentPage + 1);

    if (start > 2) {
        pages.push('ellipsis');
    }

    for (let page = start; page <= end; page++) {
        pages.push(page);
    }

    if (end < lastPage - 1) {
        pages.push('ellipsis');
    }

    pages.push(lastPage);

    return pages;
}

export function Pagination({
    paginator,
    currentPage: currentPageProp,
    lastPage: lastPageProp,
    perPage: perPageProp,
    total: totalProp,
    from: fromProp,
    to: toProp,
    onPageChange,
    onPerPageChange,
    perPageOptions = [10, 25, 50, 100],
    itemLabel = 'data',
    preserveScroll = true,
    preserveState = true,
    className,
}: PaginationProps) {
    const currentPage = paginator?.current_page ?? currentPageProp ?? 1;
    const lastPage = Math.max(1, paginator?.last_page ?? lastPageProp ?? 1);
    const perPage = paginator?.per_page ?? perPageProp ?? 10;
    const total = paginator?.total ?? totalProp ?? 0;

    const computedFrom =
        paginator?.from ??
        fromProp ??
        (total === 0 ? 0 : (currentPage - 1) * perPage + 1);
    const computedTo =
        paginator?.to ??
        toProp ??
        (total === 0 ? 0 : Math.min(currentPage * perPage, total));

    const formatNumber = (value: number) =>
        new Intl.NumberFormat('id-ID').format(value);

    const navigateToPage = (targetPage: number) => {
        if (
            targetPage < 1 ||
            targetPage > lastPage ||
            targetPage === currentPage
        ) {
            return;
        }

        if (onPageChange) {
            onPageChange(targetPage);
            return;
        }

        const matchedLink = paginator?.links?.find(
            (link) => Number(link.label) === targetPage && link.url,
        );

        if (matchedLink?.url) {
            router.get(matchedLink.url, {}, { preserveScroll, preserveState });
            return;
        }

        if (targetPage === currentPage - 1 && paginator?.prev_page_url) {
            router.get(
                paginator.prev_page_url,
                {},
                { preserveScroll, preserveState },
            );
            return;
        }

        if (targetPage === currentPage + 1 && paginator?.next_page_url) {
            router.get(
                paginator.next_page_url,
                {},
                { preserveScroll, preserveState },
            );
        }
    };

    const pages = buildPageRange(currentPage, lastPage);

    return (
        <div
            className={cn(
                'flex flex-col items-center justify-between gap-3 sm:flex-row',
                className,
            )}
        >
            {/* Left: Summary & optional per-page selector */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                <p className="tabular-nums">
                    {total > 0 ? (
                        <>
                            Menampilkan{' '}
                            <span className="font-medium text-foreground">
                                {formatNumber(computedFrom)}&ndash;
                                {formatNumber(computedTo)}
                            </span>{' '}
                            dari{' '}
                            <span className="font-medium text-foreground">
                                {formatNumber(total)}
                            </span>{' '}
                            {itemLabel}
                        </>
                    ) : (
                        <>Menampilkan 0 {itemLabel}</>
                    )}
                </p>

                {onPerPageChange && (
                    <div className="flex items-center gap-1.5">
                        <span className="hidden text-slate-300 sm:inline dark:text-slate-700">
                            &middot;
                        </span>
                        <span>Baris:</span>
                        <Select
                            value={String(perPage)}
                            onValueChange={(value) =>
                                onPerPageChange(Number(value))
                            }
                        >
                            <SelectTrigger
                                aria-label="Jumlah baris per halaman"
                                className="h-7 w-[68px] bg-white px-2 text-xs shadow-none dark:bg-slate-900/60"
                            >
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent align="start">
                                {perPageOptions.map((option) => (
                                    <SelectItem
                                        key={option}
                                        value={String(option)}
                                        className="text-xs tabular-nums"
                                    >
                                        {option}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                )}
            </div>

            {/* Right: Page controls */}
            <nav
                aria-label="Navigasi halaman"
                className="flex items-center gap-1"
            >
                <button
                    type="button"
                    onClick={() => navigateToPage(currentPage - 1)}
                    disabled={currentPage <= 1}
                    aria-label="Halaman sebelumnya"
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <ChevronLeft className="size-3.5" />
                    <span className="hidden sm:inline">Sebelumnya</span>
                </button>

                <div className="flex items-center gap-1">
                    {pages.map((page, index) => {
                        if (page === 'ellipsis') {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    aria-hidden="true"
                                    className="inline-flex size-8 items-center justify-center text-slate-400"
                                >
                                    <MoreHorizontal className="size-3.5" />
                                </span>
                            );
                        }

                        const isActive = page === currentPage;

                        return (
                            <button
                                key={page}
                                type="button"
                                onClick={() => navigateToPage(page)}
                                aria-current={isActive ? 'page' : undefined}
                                className={cn(
                                    'inline-flex h-8 min-w-8 cursor-pointer items-center justify-center rounded-md border px-2 text-xs font-medium tabular-nums transition-colors',
                                    isActive
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-white text-slate-700 hover:bg-slate-50 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800',
                                )}
                            >
                                {page}
                            </button>
                        );
                    })}
                </div>

                <button
                    type="button"
                    onClick={() => navigateToPage(currentPage + 1)}
                    disabled={currentPage >= lastPage}
                    aria-label="Halaman berikutnya"
                    className="inline-flex h-8 cursor-pointer items-center gap-1 rounded-md border border-border bg-white px-2.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:pointer-events-none disabled:opacity-40 dark:bg-slate-900/60 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                    <span className="hidden sm:inline">Berikutnya</span>
                    <ChevronRight className="size-3.5" />
                </button>
            </nav>
        </div>
    );
}
