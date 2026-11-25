import { cva } from 'class-variance-authority';
import type { VariantProps } from 'class-variance-authority';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

const statusBadgeVariants = cva(
    'inline-flex w-fit shrink-0 items-center gap-1.5 rounded-md border px-2 py-0.5 text-xs font-medium whitespace-nowrap tabular-nums',
    {
        variants: {
            variant: {
                success:
                    'border-emerald-200/90 bg-emerald-50 text-emerald-700 dark:border-emerald-900/70 dark:bg-emerald-950/50 dark:text-emerald-300',
                warning:
                    'border-amber-200/90 bg-amber-50 text-amber-800 dark:border-amber-900/70 dark:bg-amber-950/50 dark:text-amber-300',
                danger: 'border-red-200/90 bg-red-50 text-red-700 dark:border-red-900/70 dark:bg-red-950/50 dark:text-red-300',
                info: 'border-sky-200/90 bg-sky-50 text-sky-700 dark:border-sky-900/70 dark:bg-sky-950/50 dark:text-sky-300',
                neutral:
                    'border-slate-200 bg-slate-100/80 text-slate-700 dark:border-slate-700/80 dark:bg-slate-800/70 dark:text-slate-300',
                brand: 'border-orange-200/90 bg-orange-50 text-[#C85616] dark:border-orange-900/70 dark:bg-orange-950/50 dark:text-orange-300',
            },
        },
        defaultVariants: {
            variant: 'neutral',
        },
    },
);

const dotColors: Record<
    NonNullable<VariantProps<typeof statusBadgeVariants>['variant']>,
    string
> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    brand: 'bg-brand',
};

export type StatusBadgeVariant = NonNullable<
    VariantProps<typeof statusBadgeVariants>['variant']
>;

export type StatusBadgeProps = {
    children: ReactNode;
    variant?: StatusBadgeVariant;
    dot?: boolean;
    className?: string;
};

export function StatusBadge({
    children,
    variant = 'neutral',
    dot = true,
    className,
}: StatusBadgeProps) {
    return (
        <span className={cn(statusBadgeVariants({ variant }), className)}>
            {dot && (
                <span
                    aria-hidden="true"
                    className={cn(
                        'size-1.5 shrink-0 rounded-full',
                        dotColors[variant],
                    )}
                />
            )}
            {children}
        </span>
    );
}
