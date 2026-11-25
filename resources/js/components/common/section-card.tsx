import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type SectionCardProps = {
    title?: string;
    description?: string;
    actions?: ReactNode;
    footer?: ReactNode;
    noPadding?: boolean;
    children: ReactNode;
    className?: string;
    contentClassName?: string;
};

export function SectionCard({
    title,
    description,
    actions,
    footer,
    noPadding = false,
    children,
    className,
    contentClassName,
}: SectionCardProps) {
    const hasHeader = Boolean(title || description || actions);

    return (
        <section
            className={cn(
                'overflow-hidden rounded-xl border border-border bg-card text-card-foreground',
                className,
            )}
        >
            {hasHeader && (
                <div className="flex flex-col gap-2 border-b border-border px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
                    <div className="min-w-0">
                        {title && (
                            <h2 className="text-[15px] font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                                {title}
                            </h2>
                        )}
                        {description && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
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
            )}

            <div className={cn(!noPadding && 'p-4 sm:p-5', contentClassName)}>
                {children}
            </div>

            {footer && (
                <div className="border-t border-border bg-slate-50/40 px-4 py-3 sm:px-5 dark:bg-slate-900/30">
                    {footer}
                </div>
            )}
        </section>
    );
}
