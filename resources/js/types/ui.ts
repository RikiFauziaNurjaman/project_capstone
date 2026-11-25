import type { ReactNode } from 'react';
import type { BreadcrumbItem } from '@/types/navigation';

export type HeaderProjectOption = {
    id: string;
    name: string;
    location?: string;
};

export type HeaderNotificationItem = {
    id: string | number;
    title: string;
    description?: string;
    time?: string;
    unread?: boolean;
    href?: string;
};

export type AppLayoutProps = {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
    projects?: HeaderProjectOption[];
    selectedProjectId?: string;
    onProjectChange?: (projectId: string) => void;
    notifications?: HeaderNotificationItem[];
    unreadNotificationsCount?: number;
};

export type AppVariant = 'header' | 'sidebar';

export type FlashToast = {
    type: 'success' | 'info' | 'warning' | 'error';
    message: string;
};

export type AuthLayoutProps = {
    children?: ReactNode;
    name?: string;
    title?: string;
    description?: string;
};
