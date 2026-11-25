import { Link } from '@inertiajs/react';
import { Fragment } from 'react';
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import type { BreadcrumbItem as BreadcrumbItemType } from '@/types';

type BreadcrumbsProps = {
    breadcrumbs: BreadcrumbItemType[];
    rootLabel?: string | null;
    className?: string;
};

export function Breadcrumbs({
    breadcrumbs,
    rootLabel = 'Workspace',
    className,
}: BreadcrumbsProps) {
    const items: BreadcrumbItemType[] =
        rootLabel &&
        breadcrumbs.length > 0 &&
        breadcrumbs[0]?.title.toLowerCase() !== rootLabel.toLowerCase()
            ? [{ title: rootLabel }, ...breadcrumbs]
            : breadcrumbs;

    if (items.length === 0) {
        return null;
    }

    return (
        <Breadcrumb className={className}>
            <BreadcrumbList className="gap-2 text-[13.5px] sm:gap-2.5">
                {items.map((item, index) => {
                    const isLast = index === items.length - 1;

                    return (
                        <Fragment key={`${item.title}-${index}`}>
                            <BreadcrumbItem>
                                {isLast ? (
                                    <BreadcrumbPage className="font-semibold text-slate-800 dark:text-slate-100">
                                        {item.title}
                                    </BreadcrumbPage>
                                ) : item.href ? (
                                    <BreadcrumbLink
                                        asChild
                                        className="font-normal text-slate-400 transition-colors hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                                    >
                                        <Link href={item.href}>
                                            {item.title}
                                        </Link>
                                    </BreadcrumbLink>
                                ) : (
                                    <span className="font-normal text-slate-400 dark:text-slate-400">
                                        {item.title}
                                    </span>
                                )}
                            </BreadcrumbItem>
                            {!isLast && (
                                <BreadcrumbSeparator className="text-slate-300 select-none dark:text-slate-600">
                                    /
                                </BreadcrumbSeparator>
                            )}
                        </Fragment>
                    );
                })}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
