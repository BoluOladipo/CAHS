import { SHIPMENT_MILESTONES } from "./statuses.js";
export function nextAllowedMilestones(current) {
    if (!current)
        return ["packaged"];
    const idx = SHIPMENT_MILESTONES.indexOf(current);
    if (idx < 0 || idx === SHIPMENT_MILESTONES.length - 1)
        return [];
    return [SHIPMENT_MILESTONES[idx + 1]];
}
export function canAdvanceMilestone(current, next, adminOverride) {
    if (adminOverride)
        return { ok: true };
    const allowed = nextAllowedMilestones(current);
    if (!allowed.includes(next)) {
        return {
            ok: false,
            reason: "Shipment milestones must follow the allowed sequence. Admin override with a reason is required to skip or reverse.",
        };
    }
    return { ok: true };
}
export function isActiveShipment(latest, jobStatus) {
    if (jobStatus && ["cancelled", "completed"].includes(jobStatus))
        return false;
    return latest !== "delivered";
}
export function canViewDriverContact(party, shipmentActive) {
    if (!shipmentActive)
        return false;
    return party === "buyer" || party === "seller" || party === "assigned_provider" || party === "admin";
}
