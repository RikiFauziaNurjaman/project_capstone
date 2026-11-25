import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type StatCardTone =
    | 'default'
    | 'brand'
    | 'success'
    | 'warning'
    | 'danger';

export type StatCardProps = {
    label: string;
    value: string | number;
    helper?: string;
    delta?: {
        label: string;
        trend?: 'up' | 'down' | 'neutral';
    };
    icon?: LucideIcon;
    tone?: StatCardTone;
    className?: string;
};

const iconToneClasses: Record<StatCardTone, string> = {
    default:
        'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
    brand: 'bg-orange-50 text-brand dark:bg-orange-950/50 dark:text-orange-400',
    success:
        'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
    warning:
        'bg-amber-50 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
    danger: 'bg-red-50 text-red-700 dark:bg-red-950/50 dark:text-red-400',
};

const deltaToneClasses = {
    up: 'text-emerald-700 dark:text-emerald-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-muted-foreground',
};

export function StatCard({
    label,
    value,
    helper,
    delta,
    icon: Icon,
    tone = 'default',
    className,
}: StatCardProps) {
    const displayValue =
        typeof value === 'number'
            ? new Intl.NumberFormat('id-ID').format(value)
            : value;

    return (
        <div
            className={cn(
                'flex flex-col justify-between rounded-xl border border-border bg-card p-4 transition-colors sm:p-5',
                className,
            )}
        >
            <div className="flex items-start justify-between gap-3">
                <span className="text-xs font-medium text-muted-foreground">
                    {label}
                </span>
                {Icon && (
                    <span
                        className={cn(
                            'inline-flex size-8 shrink-0 items-center justify-center rounded-lg',
                            iconToneClasses[tone],
                        )}
                    >
                        <Icon className="size-4" />
                    </span>
                )}
            </div>

            <div className="mt-3">
                <div className="text-2xl font-semibold tracking-tight text-slate-900 tabular-nums dark:text-slate-100">
                    {displayValue}
                </div>

                {(helper || delta) && (
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs">
                        {delta && (
                            <span
                                className={cn(
                                    'font-medium tabular-nums',
                                    deltaToneClasses[delta.trend ?? 'neutral'],
                                )}
                            >
                                {delta.label}
                            </span>
                        )}
                        {helper && (
                            <span className="text-muted-foreground">
                                {helper}
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export function StatCardGrid({
    children,
    columns = 4,
    className,
}: {
    children: ReactNode;
    columns?: 2 | 3 | 4;
    className?: string;
}) {
    const gridClasses = {
        2: 'grid-cols-1 sm:grid-cols-2',
        3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
        4: 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-4',
    }[columns];

    return (
        <div className={cn('grid gap-4', gridClasses, className)}>
            {children}
        </div>
    );
}
