export const ROLES = [
  "FARMER",
  "TRADER",
  "STORAGE_PROVIDER",
  "LOGISTICS_PROVIDER",
  "BANK_OFFICER",
  "PLATFORM_ADMIN",
] as const;

export type Role = (typeof ROLES)[number];

export const ROLE_LABELS: Record<Role, string> = {
  FARMER: "Farmer",
  TRADER: "Trader / Buyer",
  STORAGE_PROVIDER: "Storage provider",
  LOGISTICS_PROVIDER: "Logistics provider",
  BANK_OFFICER: "Bank officer",
  PLATFORM_ADMIN: "Platform admin",
};

export const PERMISSIONS = {
  listings: {
    create: ["FARMER"] as Role[],
    browse: ["TRADER", "FARMER", "PLATFORM_ADMIN", "BANK_OFFICER"] as Role[],
  },
  orders: {
    place: ["TRADER"] as Role[],
    manageIncoming: ["FARMER"] as Role[],
  },
  storage: {
    publish: ["STORAGE_PROVIDER"] as Role[],
    book: ["FARMER", "TRADER"] as Role[],
  },
  logistics: {
    acceptJobs: ["LOGISTICS_PROVIDER"] as Role[],
  },
  loans: {
    apply: ["FARMER", "TRADER"] as Role[],
    decide: ["BANK_OFFICER"] as Role[],
  },
  admin: {
    verify: ["PLATFORM_ADMIN"] as Role[],
    config: ["PLATFORM_ADMIN", "BANK_OFFICER"] as Role[],
  },
} as const;

export function hasRole(userRole: Role, allowed: Role[]): boolean {
  return allowed.includes(userRole);
}
