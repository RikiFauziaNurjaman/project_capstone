export type PermissionRecord = {
    id: number;
    name: string;
};

export type RoleRecord = {
    id: number;
    name: string;
    guard_name?: string;
    users_count?: number;
    permissions?: PermissionRecord[];
    created_at?: string;
};

export type ManagedUserRecord = {
    id: number;
    name: string;
    email: string;
    role: string;
    email_verified_at: string | null;
    roles: Array<{
        id: number;
        name: string;
    }>;
    created_at: string;
    updated_at: string;
};

export type UserStats = {
    total: number;
    verified: number;
    admins: number;
    roles_count: number;
};
