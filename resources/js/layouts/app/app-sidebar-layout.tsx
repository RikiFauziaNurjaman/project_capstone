import { AppContent } from '@/components/app-content';
import { AppFooter } from '@/components/app-footer';
import { AppShell } from '@/components/app-shell';
import { AppSidebar } from '@/components/app-sidebar';
import { AppSidebarHeader } from '@/components/app-sidebar-header';
import type { AppLayoutProps } from '@/types';

export default function AppSidebarLayout({
    children,
    breadcrumbs = [],
    projects,
    selectedProjectId,
    onProjectChange,
    notifications,
    unreadNotificationsCount,
}: AppLayoutProps) {
    return (
        <AppShell variant="sidebar">
            <AppSidebar />
            <AppContent
                variant="sidebar"
                className="flex min-h-svh min-w-0 flex-col overflow-x-clip bg-[#F8F9FB] dark:bg-background"
            >
                <AppSidebarHeader
                    breadcrumbs={breadcrumbs}
                    projects={projects}
                    selectedProjectId={selectedProjectId}
                    onProjectChange={onProjectChange}
                    notifications={notifications}
                    unreadNotificationsCount={unreadNotificationsCount}
                />
                <div className="flex flex-1 flex-col">{children}</div>
                <AppFooter />
            </AppContent>
        </AppShell>
    );
}
