import { RotateCcw, Search, SlidersHorizontal, X } from 'lucide-react';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

export type SearchInputProps = {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    debounceMs?: number;
    className?: string;
    ariaLabel?: string;
};

export function SearchInput({
    value,
    onChange,
    placeholder = 'Cari data...',
    debounceMs = 0,
    className,
    ariaLabel = 'Pencarian',
}: SearchInputProps) {
    const [localValue, setLocalValue] = useState(value);

    useEffect(() => {
        setLocalValue(value);
    }, [value]);

    useEffect(() => {
        if (debounceMs <= 0 || localValue === value) {
            return;
        }

        const timer = window.setTimeout(() => {
            onChange(localValue);
        }, debounceMs);

        return () => window.clearTimeout(timer);
    }, [localValue, debounceMs, onChange, value]);

    const handleChange = (nextValue: string) => {
        setLocalValue(nextValue);

        if (debounceMs <= 0) {
            onChange(nextValue);
        }
    };

    const handleClear = () => {
        setLocalValue('');
        onChange('');
    };

    return (
        <div className={cn('relative w-full sm:w-64 lg:w-72', className)}>
            <Search
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-slate-400"
            />
            <Input
                type="search"
                value={localValue}
                onChange={(event) => handleChange(event.target.value)}
                placeholder={placeholder}
                aria-label={ariaLabel}
                className="h-9 bg-white pr-8 pl-9 text-[13.5px] shadow-none placeholder:text-slate-400 dark:bg-slate-900/60"
            />
            {localValue && (
                <button
                    type="button"
                    onClick={handleClear}
                    aria-label="Hapus pencarian"
                    className="absolute top-1/2 right-2 inline-flex size-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                >
                    <X className="size-3.5" />
                </button>
            )}
        </div>
    );
}

export type FilterOption = {
    label: string;
    value: string;
};

const ALL_VALUE = '__all__';

export type FilterSelectProps = {
    value: string;
    onValueChange: (value: string) => void;
    options: FilterOption[];
    placeholder?: string;
    allLabel?: string;
    includeAllOption?: boolean;
    className?: string;
    ariaLabel?: string;
};

export function FilterSelect({
    value,
    onValueChange,
    options,
    placeholder = 'Pilih filter',
    allLabel = 'Semua',
    includeAllOption = true,
    className,
    ariaLabel,
}: FilterSelectProps) {
    const resolvedValue =
        value === '' && includeAllOption ? ALL_VALUE : value || undefined;

    const handleValueChange = (nextValue: string) => {
        onValueChange(nextValue === ALL_VALUE ? '' : nextValue);
    };

    return (
        <Select value={resolvedValue} onValueChange={handleValueChange}>
            <SelectTrigger
                aria-label={ariaLabel ?? placeholder}
                className={cn(
                    'h-9 w-full bg-white text-[13px] shadow-none sm:w-auto sm:min-w-[150px] dark:bg-slate-900/60',
                    className,
                )}
            >
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent align="start">
                {includeAllOption && (
                    <SelectItem value={ALL_VALUE}>{allLabel}</SelectItem>
                )}
                {options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                        {option.label}
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

export type ActiveFilterChip = {
    key: string;
    label: string;
    valueLabel: string;
    onRemove: () => void;
};

export type ActiveFiltersProps = {
    chips: ActiveFilterChip[];
    onResetAll?: () => void;
    className?: string;
};

export function ActiveFilters({
    chips,
    onResetAll,
    className,
}: ActiveFiltersProps) {
    if (chips.length === 0) {
        return null;
    }

    return (
        <div
            className={cn(
                'flex flex-wrap items-center gap-2 border-t border-border/70 pt-3',
                className,
            )}
        >
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <SlidersHorizontal className="size-3.5" />
                Filter aktif:
            </span>

            {chips.map((chip) => (
                <span
                    key={chip.key}
                    className="inline-flex items-center gap-1.5 rounded-md border border-border bg-slate-50 px-2 py-0.5 text-xs text-slate-700 dark:bg-slate-800/80 dark:text-slate-200"
                >
                    <span className="text-muted-foreground">{chip.label}:</span>
                    <span className="font-medium">{chip.valueLabel}</span>
                    <button
                        type="button"
                        onClick={chip.onRemove}
                        aria-label={`Hapus filter ${chip.label}`}
                        className="ml-0.5 cursor-pointer rounded text-slate-400 transition-colors hover:text-slate-700 dark:hover:text-slate-100"
                    >
                        <X className="size-3" />
                    </button>
                </span>
            ))}

            {onResetAll && (
                <button
                    type="button"
                    onClick={onResetAll}
                    className="ml-auto inline-flex cursor-pointer items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                    <RotateCcw className="size-3" />
                    Reset semua
                </button>
            )}
        </div>
    );
}

export type FilterBarProps = {
    children?: ReactNode;
    actions?: ReactNode;
    activeFilters?: ActiveFilterChip[];
    onResetFilters?: () => void;
    hasActiveFilters?: boolean;
    className?: string;
};

export function FilterBar({
    children,
    actions,
    activeFilters = [],
    onResetFilters,
    hasActiveFilters,
    className,
}: FilterBarProps) {
    const showResetButton =
        Boolean(onResetFilters) &&
        (hasActiveFilters ?? activeFilters.length > 0);

    return (
        <div className={cn('flex flex-col gap-3', className)}>
            <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center">
                    {children}
                    {showResetButton && activeFilters.length === 0 && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={onResetFilters}
                            className="h-9 cursor-pointer px-2.5 text-xs text-muted-foreground hover:text-foreground"
                        >
                            <RotateCcw className="size-3.5" />
                            Reset
                        </Button>
                    )}
                </div>

                {actions && (
                    <div className="flex shrink-0 flex-wrap items-center gap-2">
                        {actions}
                    </div>
                )}
            </div>

            <ActiveFilters chips={activeFilters} onResetAll={onResetFilters} />
        </div>
    );
}
