export const ROLES = [
    "FARMER",
    "TRADER",
    "STORAGE_PROVIDER",
    "LOGISTICS_PROVIDER",
    "BANK_OFFICER",
    "PLATFORM_ADMIN",
];
export const ROLE_LABELS = {
    FARMER: "Farmer",
    TRADER: "Trader / Buyer",
    STORAGE_PROVIDER: "Storage provider",
    LOGISTICS_PROVIDER: "Logistics provider",
    BANK_OFFICER: "Bank officer",
    PLATFORM_ADMIN: "Platform admin",
};
export const PERMISSIONS = {
    listings: {
        create: ["FARMER"],
        browse: ["TRADER", "FARMER", "PLATFORM_ADMIN", "BANK_OFFICER"],
    },
    orders: {
        place: ["TRADER"],
        manageIncoming: ["FARMER"],
    },
    storage: {
        publish: ["STORAGE_PROVIDER"],
        book: ["FARMER", "TRADER"],
    },
    logistics: {
        acceptJobs: ["LOGISTICS_PROVIDER"],
    },
    loans: {
        apply: ["FARMER", "TRADER"],
        decide: ["BANK_OFFICER"],
    },
    admin: {
        verify: ["PLATFORM_ADMIN"],
        config: ["PLATFORM_ADMIN", "BANK_OFFICER"],
    },
};
export function hasRole(userRole, allowed) {
    return allowed.includes(userRole);
}
