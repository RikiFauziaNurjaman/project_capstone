import { Link, usePage } from '@inertiajs/react';
import {
    ArrowLeftRight,
    Box,
    Building2,
    FileChartColumn,
    LayoutGrid,
    Ruler,
    Settings,
    Tags,
    Truck,
    Users,
    Wrench,
} from 'lucide-react';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    useSidebar,
} from '@/components/ui/sidebar';
import { useCurrentUrl } from '@/hooks/use-current-url';
import { cn, toUrl } from '@/lib/utils';
import { dashboard } from '@/routes';
import { index as categoriesIndex } from '@/routes/master/categories';
import { index as itemsIndex } from '@/routes/master/items';
import { index as suppliersIndex } from '@/routes/master/suppliers';
import { index as unitsIndex } from '@/routes/master/units';
import { edit as editProfile } from '@/routes/profile';
import { index as usersIndex } from '@/routes/users';
import type { NavItem } from '@/types';

export type AppSidebarProps = {
    brandTitle?: string;
    brandSubtitle?: string;
    companyName?: string;
    companySubtitle?: string;
    navItems?: NavItem[];
    masterNavItems?: NavItem[];
    footerItems?: NavItem[];
    inventoryCount?: number | string | null;
};

function formatBadge(value: string | number | null | undefined): string | null {
    if (value === null || value === undefined || value === '') {
        return null;
    }

    if (typeof value === 'number') {
        return new Intl.NumberFormat('id-ID').format(value);
    }

    return value;
}

export function AppSidebar({
    brandTitle = 'MKS',
    brandSubtitle = 'INVENTORY MANAGEMENT',
    companyName = 'CV. Multi Karya Sukses',
    companySubtitle = 'Workspace perusahaan',
    navItems,
    masterNavItems,
    footerItems,
    inventoryCount,
}: AppSidebarProps) {
    const { auth, sidebarStats } = usePage().props;
    const { isCurrentUrl, isCurrentOrParentUrl } = useCurrentUrl();
    const { setOpenMobile } = useSidebar();

    const userRoles = auth?.roles ?? [];
    const userPermissions = auth?.permissions ?? [];
    const canAccessUsers =
        userRoles.includes('admin') ||
        userPermissions.includes('users.view') ||
        userPermissions.includes('users.manage') ||
        auth?.user?.role === 'admin';

    const resolvedInventoryCount =
        inventoryCount !== undefined
            ? inventoryCount
            : (sidebarStats?.itemsCount ?? 0);

    const workspaceNavItems: NavItem[] = navItems ?? [
        {
            title: 'Ringkasan',
            href: dashboard(),
            icon: LayoutGrid,
        },
        {
            title: 'Inventaris',
            href: itemsIndex(),
            icon: Box,
            badge: resolvedInventoryCount,
        },
        {
            title: 'Barang masuk / keluar',
            href: '/barang-masuk-keluar',
            icon: ArrowLeftRight,
            disabled: true,
        },
        {
            title: 'Proyek & lokasi',
            href: '/proyek-lokasi',
            icon: Building2,
            disabled: true,
        },
        {
            title: 'Pemeliharaan',
            href: '/pemeliharaan',
            icon: Wrench,
            disabled: true,
        },
        {
            title: 'Laporan',
            href: '/laporan',
            icon: FileChartColumn,
            disabled: true,
        },
    ];

    const masterDataItems: NavItem[] = masterNavItems ?? [
        {
            title: 'Kategori',
            href: categoriesIndex(),
            icon: Tags,
        },
        {
            title: 'Satuan',
            href: unitsIndex(),
            icon: Ruler,
        },
        {
            title: 'Supplier',
            href: suppliersIndex(),
            icon: Truck,
        },
    ];

    const bottomNavItems: NavItem[] = footerItems ?? [
        ...(canAccessUsers
            ? [
                  {
                      title: 'Pengguna & akses',
                      href: usersIndex(),
                      icon: Users,
                  },
              ]
            : []),
        {
            title: 'Pengaturan',
            href: editProfile(),
            icon: Settings,
        },
    ];

    const resolveActive = (item: NavItem): boolean => {
        if (typeof item.isActive === 'boolean') {
            return item.isActive;
        }

        const targetUrl = toUrl(item.href);

        if (targetUrl === '/settings/profile') {
            return isCurrentOrParentUrl('/settings');
        }

        if (targetUrl === '/users') {
            return (
                isCurrentOrParentUrl('/users') || isCurrentOrParentUrl('/roles')
            );
        }

        if (targetUrl === toUrl(dashboard())) {
            return isCurrentUrl(item.href);
        }

        return isCurrentOrParentUrl(item.href);
    };

    const renderNavItem = (item: NavItem) => {
        const active = resolveActive(item);
        const formattedBadge = formatBadge(item.badge);
        const Icon = item.icon;

        return (
            <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                    asChild={!item.disabled}
                    isActive={active}
                    tooltip={{ children: item.title }}
                    className={cn(
                        'group/nav h-10 rounded-xl px-3.5 text-[13.5px] transition-colors duration-150',
                        'group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:size-10! group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0!',
                        active
                            ? 'bg-brand font-semibold text-white shadow-[0_1px_2px_rgba(0,0,0,0.2)] hover:bg-[#e56820] hover:text-white data-[active=true]:bg-brand data-[active=true]:text-white'
                            : 'font-medium text-[#9BA7B8] hover:bg-white/[0.06] hover:text-white',
                        item.disabled &&
                            'cursor-not-allowed opacity-45 hover:bg-transparent hover:text-[#9BA7B8]',
                    )}
                >
                    {item.disabled ? (
                        <span className="flex w-full items-center gap-3">
                            {Icon && (
                                <Icon
                                    className={cn(
                                        'size-[18px] shrink-0',
                                        active
                                            ? 'text-white'
                                            : 'text-[#8492A6]',
                                    )}
                                />
                            )}
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                                {item.title}
                            </span>
                            {formattedBadge && (
                                <span
                                    className={cn(
                                        'ml-auto rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums group-data-[collapsible=icon]:hidden',
                                        active
                                            ? 'bg-black/20 text-white'
                                            : 'bg-white/[0.08] text-[#CBD5E1]',
                                    )}
                                >
                                    {formattedBadge}
                                </span>
                            )}
                        </span>
                    ) : (
                        <Link
                            href={item.href}
                            prefetch
                            onClick={() => setOpenMobile(false)}
                            className="flex w-full items-center gap-3"
                        >
                            {Icon && (
                                <Icon
                                    className={cn(
                                        'size-[18px] shrink-0 transition-colors',
                                        active
                                            ? 'text-white'
                                            : 'text-[#8492A6] group-hover/nav:text-white',
                                    )}
                                />
                            )}
                            <span className="truncate group-data-[collapsible=icon]:hidden">
                                {item.title}
                            </span>
                            {formattedBadge && (
                                <span
                                    className={cn(
                                        'ml-auto rounded-md px-2 py-0.5 text-[11px] font-semibold tabular-nums group-data-[collapsible=icon]:hidden',
                                        active
                                            ? 'bg-black/20 text-white'
                                            : 'bg-white/[0.08] text-[#CBD5E1]',
                                    )}
                                >
                                    {formattedBadge}
                                </span>
                            )}
                        </Link>
                    )}
                </SidebarMenuButton>
            </SidebarMenuItem>
        );
    };

    return (
        <Sidebar
            collapsible="icon"
            variant="sidebar"
            className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground"
        >
            <SidebarHeader className="gap-0 px-4 pt-6 pb-3 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:pt-5">
                {/* Brand Lockup */}
                <Link
                    href={dashboard()}
                    prefetch
                    className="block px-1 group-data-[collapsible=icon]:px-0 group-data-[collapsible=icon]:text-center"
                >
                    <div className="text-[26px] leading-none font-bold tracking-tight text-white group-data-[collapsible=icon]:text-base">
                        {brandTitle}
                    </div>
                    <div className="mt-1.5 text-[10px] font-medium tracking-[0.14em] text-[#7A889B] uppercase group-data-[collapsible=icon]:hidden">
                        {brandSubtitle}
                    </div>
                    <div className="mt-3.5 h-[3px] w-8 rounded-full bg-brand group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:mt-2 group-data-[collapsible=icon]:w-5" />
                </Link>

                {/* Company Workspace Card */}
                <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/[0.05] bg-[#1C2536] px-3.5 py-3 group-data-[collapsible=icon]:mx-auto group-data-[collapsible=icon]:mt-4 group-data-[collapsible=icon]:size-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0">
                    <Building2 className="size-[18px] shrink-0 text-[#94A3B8]" />
                    <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                        <p className="truncate text-[13px] leading-snug font-semibold text-white">
                            {companyName}
                        </p>
                        <p className="truncate text-[11px] leading-snug text-[#7A889B]">
                            {companySubtitle}
                        </p>
                    </div>
                </div>
            </SidebarHeader>

            <SidebarContent className="px-3 py-2 group-data-[collapsible=icon]:px-2">
                <SidebarGroup className="p-0">
                    <SidebarGroupLabel className="mb-1 h-auto px-3 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.09em] text-[#66758A] uppercase">
                        WORKSPACE
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {workspaceNavItems.map(renderNavItem)}
                    </SidebarMenu>
                </SidebarGroup>

                <SidebarGroup className="mt-3 p-0">
                    <SidebarGroupLabel className="mb-1 h-auto px-3 pt-2 pb-1 text-[10.5px] font-semibold tracking-[0.09em] text-[#66758A] uppercase">
                        MASTER DATA
                    </SidebarGroupLabel>
                    <SidebarMenu className="gap-1">
                        {masterDataItems.map(renderNavItem)}
                    </SidebarMenu>
                </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="px-3 pt-0 pb-5 group-data-[collapsible=icon]:px-2">
                <div className="mx-1 mb-3 h-px bg-white/[0.08]" />
                <SidebarMenu className="gap-1">
                    {bottomNavItems.map(renderNavItem)}
                </SidebarMenu>
            </SidebarFooter>
        </Sidebar>
    );
}
