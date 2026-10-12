import { SHIPMENT_MILESTONES, type ShipmentMilestone } from "./statuses.js";

export function nextAllowedMilestones(current: ShipmentMilestone | null): ShipmentMilestone[] {
  if (!current) return ["packaged"];
  const idx = SHIPMENT_MILESTONES.indexOf(current);
  if (idx < 0 || idx === SHIPMENT_MILESTONES.length - 1) return [];
  return [SHIPMENT_MILESTONES[idx + 1]];
}

export function canAdvanceMilestone(
  current: ShipmentMilestone | null,
  next: ShipmentMilestone,
  adminOverride: boolean,
): { ok: boolean; reason?: string } {
  if (adminOverride) return { ok: true };
  const allowed = nextAllowedMilestones(current);
  if (!allowed.includes(next)) {
    return {
      ok: false,
      reason: "Shipment milestones must follow the allowed sequence. Admin override with a reason is required to skip or reverse.",
    };
  }
  return { ok: true };
}

export function isActiveShipment(latest?: ShipmentMilestone | null, jobStatus?: string): boolean {
  if (jobStatus && ["cancelled", "completed"].includes(jobStatus)) return false;
  return latest !== "delivered";
}

export type ShipmentParty = "buyer" | "seller" | "assigned_provider" | "admin" | "other";

export function canViewDriverContact(party: ShipmentParty, shipmentActive: boolean): boolean {
  if (!shipmentActive) return false;
  return party === "buyer" || party === "seller" || party === "assigned_provider" || party === "admin";
}
