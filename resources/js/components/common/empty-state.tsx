import type { LucideIcon } from 'lucide-react';
import { Inbox } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type EmptyStateProps = {
    title?: string;
    description?: string;
    icon?: LucideIcon;
    action?: ReactNode;
    compact?: boolean;
    className?: string;
};

export function EmptyState({
    title = 'Belum ada data',
    description = 'Data yang sesuai dengan pencarian atau filter Anda belum tersedia.',
    icon: Icon = Inbox,
    action,
    compact = false,
    className,
}: EmptyStateProps) {
    return (
        <div
            className={cn(
                'flex flex-col items-center justify-center text-center',
                compact ? 'px-4 py-8' : 'px-6 py-12',
                className,
            )}
        >
            <div className="mb-3 flex size-10 items-center justify-center rounded-lg border border-border bg-muted/60 text-slate-500 dark:text-slate-400">
                <Icon className="size-5" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                {title}
            </h3>
            {description && (
                <p className="mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                    {description}
                </p>
            )}
            {action && <div className="mt-4">{action}</div>}
        </div>
    );
}
