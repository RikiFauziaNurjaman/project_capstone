import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type PageContainerProps = {
    children: ReactNode;
    className?: string;
    maxWidth?: 'full' | '7xl' | '6xl';
};

export function PageContainer({
    children,
    className,
    maxWidth = 'full',
}: PageContainerProps) {
    const maxWidthClass = {
        full: 'max-w-[1440px]',
        '7xl': 'max-w-7xl',
        '6xl': 'max-w-6xl',
    }[maxWidth];

    return (
        <div
            className={cn(
                'mx-auto flex w-full flex-1 flex-col gap-5 p-4 sm:p-6',
                maxWidthClass,
                className,
            )}
        >
            {children}
        </div>
    );
}

export type PageHeaderProps = {
    title: string;
    description?: string;
    badge?: string | number;
    actions?: ReactNode;
    className?: string;
};

export function PageHeader({
    title,
    description,
    badge,
    actions,
    className,
}: PageHeaderProps) {
    return (
        <div
            className={cn(
                'flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between',
                className,
            )}
        >
            <div className="min-w-0 space-y-1">
                <div className="flex flex-wrap items-center gap-2.5">
                    <h1 className="text-xl font-semibold tracking-tight text-slate-900 sm:text-[22px] dark:text-slate-100">
                        {title}
                    </h1>
                    {badge !== undefined && badge !== null && (
                        <span className="inline-flex items-center rounded-md border border-border bg-white px-2 py-0.5 text-xs font-semibold text-slate-600 tabular-nums dark:bg-slate-800 dark:text-slate-300">
                            {typeof badge === 'number'
                                ? new Intl.NumberFormat('id-ID').format(badge)
                                : badge}
                        </span>
                    )}
                </div>
                {description && (
                    <p className="text-[13.5px] leading-relaxed text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>

            {actions && (
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                    {actions}
                </div>
            )}
        </div>
    );
}
