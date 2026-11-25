import { Link, usePage } from '@inertiajs/react';
import { Bell, Building2, Check, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { Breadcrumbs } from '@/components/breadcrumbs';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { UserMenuContent } from '@/components/user-menu-content';
import { cn } from '@/lib/utils';
import type {
    BreadcrumbItem as BreadcrumbItemType,
    HeaderNotificationItem,
    HeaderProjectOption,
} from '@/types';

const DEFAULT_PROJECTS: HeaderProjectOption[] = [
    { id: 'all', name: 'Semua proyek' },
    { id: 'gudang-utama', name: 'Gudang Utama', location: 'Workshop Pusat' },
    {
        id: 'proyek-neonbox',
        name: 'Produksi Neonbox',
        location: 'Divisi Signage',
    },
    {
        id: 'instalasi-lapangan',
        name: 'Instalasi Lapangan',
        location: 'Tim Operasional',
    },
];

function formatUserRole(role?: string): string {
    if (!role) {
        return 'Administrator';
    }

    return role
        .replace(/[_-]+/g, ' ')
        .replace(/\b\w/g, (char) => char.toUpperCase());
}

export type AppSidebarHeaderProps = {
    breadcrumbs?: BreadcrumbItemType[];
    projects?: HeaderProjectOption[];
    selectedProjectId?: string;
    onProjectChange?: (projectId: string) => void;
    notifications?: HeaderNotificationItem[];
    unreadNotificationsCount?: number;
};

export function AppSidebarHeader({
    breadcrumbs = [],
    projects = DEFAULT_PROJECTS,
    selectedProjectId,
    onProjectChange,
    notifications = [],
    unreadNotificationsCount,
}: AppSidebarHeaderProps) {
    const { auth } = usePage().props;
    const [internalProjectId, setInternalProjectId] = useState<string>(
        projects[0]?.id ?? 'all',
    );

    const activeProjectId = selectedProjectId ?? internalProjectId;
    const activeProject = projects.find(
        (project) => project.id === activeProjectId,
    ) ??
        projects[0] ?? { id: 'all', name: 'Semua proyek' };

    const unreadCount =
        unreadNotificationsCount ??
        notifications.filter((item) => item.unread).length;
    const showUnreadDot =
        unreadNotificationsCount !== undefined
            ? unreadCount > 0
            : notifications.length === 0 || unreadCount > 0;

    const handleProjectSelect = (projectId: string) => {
        if (!selectedProjectId) {
            setInternalProjectId(projectId);
        }

        onProjectChange?.(projectId);
    };

    const userName = auth?.user?.name || 'Admin Gudang';
    const userRole = formatUserRole(auth?.user?.role);

    return (
        <header className="sticky top-0 z-20 flex h-16 shrink-0 items-center justify-between gap-4 border-b border-border bg-white px-4 transition-[width,height] ease-linear sm:px-6 dark:bg-[#111824]">
            {/* Left: Sidebar trigger + Breadcrumbs */}
            <div className="flex min-w-0 items-center gap-2.5">
                <SidebarTrigger className="-ml-1 text-slate-500 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100" />
                <div className="min-w-0">
                    <Breadcrumbs breadcrumbs={breadcrumbs} />
                </div>
            </div>

            {/* Right: Project selector + Notifications + User dropdown */}
            <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                {/* Project Selector */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-lg bg-[#F3F4F6] px-3 text-[13px] font-medium text-slate-700 transition-colors outline-none hover:bg-[#E8EAEE] focus-visible:ring-2 focus-visible:ring-brand/40 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80"
                        >
                            <Building2 className="size-4 shrink-0 text-slate-500 dark:text-slate-400" />
                            <span className="hidden max-w-[140px] truncate sm:inline">
                                {activeProject.name}
                            </span>
                            <ChevronDown className="size-3.5 shrink-0 text-slate-400" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-56 rounded-lg border-border p-1 shadow-md"
                    >
                        <DropdownMenuLabel className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                            Filter Proyek &amp; Lokasi
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {projects.map((project) => {
                            const isSelected = project.id === activeProject.id;

                            return (
                                <DropdownMenuItem
                                    key={project.id}
                                    onClick={() =>
                                        handleProjectSelect(project.id)
                                    }
                                    className="flex cursor-pointer items-center justify-between gap-2 rounded-md px-2.5 py-2"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-[13px] font-medium text-foreground">
                                            {project.name}
                                        </p>
                                        {project.location && (
                                            <p className="truncate text-[11px] text-muted-foreground">
                                                {project.location}
                                            </p>
                                        )}
                                    </div>
                                    {isSelected && (
                                        <Check className="size-4 shrink-0 text-brand" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Notification Bell */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            type="button"
                            aria-label="Notifikasi"
                            className="relative inline-flex size-9 cursor-pointer items-center justify-center rounded-lg text-slate-600 transition-colors outline-none hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 focus-visible:ring-brand/40 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
                        >
                            <Bell className="size-[18px]" />
                            {showUnreadDot && (
                                <span
                                    aria-hidden="true"
                                    className="absolute top-2 right-2 size-2 rounded-full bg-brand ring-2 ring-white dark:ring-[#111824]"
                                />
                            )}
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                        align="end"
                        className="w-80 rounded-lg border-border p-0 shadow-md"
                    >
                        <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
                            <span className="text-[13px] font-semibold text-foreground">
                                Notifikasi
                            </span>
                            {unreadCount > 0 && (
                                <span className="rounded-md bg-brand/10 px-2 py-0.5 text-[11px] font-semibold text-brand tabular-nums">
                                    {unreadCount} baru
                                </span>
                            )}
                        </div>
                        <div className="max-h-72 overflow-y-auto py-1">
                            {notifications.length === 0 ? (
                                <div className="px-4 py-6 text-center">
                                    <p className="text-xs font-medium text-foreground">
                                        Semua stok terpantau aman
                                    </p>
                                    <p className="mt-1 text-[11px] text-muted-foreground">
                                        Belum ada pemberitahuan baru saat ini.
                                    </p>
                                </div>
                            ) : (
                                notifications.map((notification) => {
                                    const body = (
                                        <div className="flex items-start gap-2.5">
                                            <span
                                                className={cn(
                                                    'mt-1.5 size-1.5 shrink-0 rounded-full',
                                                    notification.unread
                                                        ? 'bg-brand'
                                                        : 'bg-transparent',
                                                )}
                                            />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-[13px] leading-snug font-medium text-foreground">
                                                    {notification.title}
                                                </p>
                                                {notification.description && (
                                                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
                                                        {
                                                            notification.description
                                                        }
                                                    </p>
                                                )}
                                                {notification.time && (
                                                    <p className="mt-1 text-[11px] text-slate-400">
                                                        {notification.time}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    );

                                    return (
                                        <DropdownMenuItem
                                            key={notification.id}
                                            asChild={Boolean(notification.href)}
                                            className="cursor-pointer rounded-none px-3.5 py-2.5"
                                        >
                                            {notification.href ? (
                                                <Link href={notification.href}>
                                                    {body}
                                                </Link>
                                            ) : (
                                                body
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })
                            )}
                        </div>
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Vertical Divider */}
                <div
                    aria-hidden="true"
                    className="h-6 w-px bg-slate-200 dark:bg-slate-800"
                />

                {/* User Menu */}
                {auth?.user ? (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                type="button"
                                className="inline-flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors outline-none hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand/40 dark:hover:bg-slate-800/70"
                            >
                                <div className="hidden min-w-0 sm:block">
                                    <p className="max-w-[140px] truncate text-[13px] leading-tight font-semibold text-slate-800 dark:text-slate-100">
                                        {userName}
                                    </p>
                                    <p className="mt-0.5 max-w-[140px] truncate text-[11px] leading-tight text-slate-400 dark:text-slate-400">
                                        {userRole}
                                    </p>
                                </div>
                                <span className="inline-flex size-8 items-center justify-center rounded-md bg-slate-100 text-xs font-semibold text-slate-700 sm:hidden dark:bg-slate-800 dark:text-slate-200">
                                    {userName.slice(0, 2).toUpperCase()}
                                </span>
                                <ChevronDown className="size-4 shrink-0 text-slate-400" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                            align="end"
                            className="w-56 rounded-lg"
                        >
                            <UserMenuContent user={auth.user} />
                        </DropdownMenuContent>
                    </DropdownMenu>
                ) : (
                    <div className="flex items-center gap-2 px-2 py-1.5 text-left">
                        <div>
                            <p className="text-[13px] leading-tight font-semibold text-slate-800 dark:text-slate-100">
                                Admin Gudang
                            </p>
                            <p className="mt-0.5 text-[11px] leading-tight text-slate-400">
                                Administrator
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </header>
    );
}
