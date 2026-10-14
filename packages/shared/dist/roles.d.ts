export declare const ROLES: readonly ["FARMER", "TRADER", "STORAGE_PROVIDER", "LOGISTICS_PROVIDER", "BANK_OFFICER", "PLATFORM_ADMIN"];
export type Role = (typeof ROLES)[number];
export declare const ROLE_LABELS: Record<Role, string>;
export declare const PERMISSIONS: {
    readonly listings: {
        readonly create: Role[];
        readonly browse: Role[];
    };
    readonly orders: {
        readonly place: Role[];
        readonly manageIncoming: Role[];
    };
    readonly storage: {
        readonly publish: Role[];
        readonly book: Role[];
    };
    readonly logistics: {
        readonly acceptJobs: Role[];
    };
    readonly loans: {
        readonly apply: Role[];
        readonly decide: Role[];
    };
    readonly admin: {
        readonly verify: Role[];
        readonly config: Role[];
    };
};
export declare function hasRole(userRole: Role, allowed: Role[]): boolean;
