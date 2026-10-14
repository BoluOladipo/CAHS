import { type ShipmentMilestone } from "./statuses.js";
export declare function nextAllowedMilestones(current: ShipmentMilestone | null): ShipmentMilestone[];
export declare function canAdvanceMilestone(current: ShipmentMilestone | null, next: ShipmentMilestone, adminOverride: boolean): {
    ok: boolean;
    reason?: string;
};
export declare function isActiveShipment(latest?: ShipmentMilestone | null, jobStatus?: string): boolean;
export type ShipmentParty = "buyer" | "seller" | "assigned_provider" | "admin" | "other";
export declare function canViewDriverContact(party: ShipmentParty, shipmentActive: boolean): boolean;
