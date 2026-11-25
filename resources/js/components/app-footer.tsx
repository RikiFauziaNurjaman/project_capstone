import { Link } from '@inertiajs/react';
import type { InertiaLinkProps } from '@inertiajs/react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type FooterLink = {
    label: string;
    href: NonNullable<InertiaLinkProps['href']>;
};

export type AppFooterProps = {
    companyName?: string;
    appLabel?: string;
    version?: string;
    links?: FooterLink[];
    rightContent?: ReactNode;
    className?: string;
};

export function AppFooter({
    companyName = 'CV. Multi Karya Sukses',
    appLabel = 'Sistem Manajemen Inventaris',
    version = 'v1.0',
    links = [],
    rightContent,
    className,
}: AppFooterProps) {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className={cn(
                'mt-auto border-t border-border bg-white px-4 py-3.5 text-xs text-muted-foreground sm:px-6 dark:bg-[#111824]',
                className,
            )}
        >
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
                <p className="leading-relaxed">
                    &copy; {currentYear}{' '}
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                        {companyName}
                    </span>
                    <span className="mx-1.5 text-slate-300 dark:text-slate-700">
                        &middot;
                    </span>
                    <span>{appLabel}</span>
                </p>

                <div className="flex flex-wrap items-center gap-4">
                    {links.map((link) => (
                        <Link
                            key={link.label}
                            href={link.href}
                            className="transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </Link>
                    ))}
                    {rightContent}
                    {version && (
                        <span className="rounded border border-border bg-muted/70 px-1.5 py-0.5 font-mono text-[11px] text-muted-foreground tabular-nums">
                            {version}
                        </span>
                    )}
                </div>
            </div>
        </footer>
    );
}
