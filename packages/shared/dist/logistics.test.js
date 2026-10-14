import { describe, expect, it } from "vitest";
import { canAdvanceMilestone, canViewDriverContact, nextAllowedMilestones } from "./logistics.js";
describe("shipment milestones", () => {
    it("requires the allowed sequence", () => {
        expect(nextAllowedMilestones(null)).toEqual(["packaged"]);
        expect(canAdvanceMilestone("packaged", "in_transit", false).ok).toBe(false);
        expect(canAdvanceMilestone("packaged", "collected", false).ok).toBe(true);
    });
    it("allows skip only with admin override", () => {
        expect(canAdvanceMilestone("packaged", "delivered", false).ok).toBe(false);
        expect(canAdvanceMilestone("packaged", "delivered", true).ok).toBe(true);
    });
});
describe("driver contact visibility", () => {
    it("is limited to authorized parties during an active shipment", () => {
        expect(canViewDriverContact("buyer", true)).toBe(true);
        expect(canViewDriverContact("other", true)).toBe(false);
        expect(canViewDriverContact("buyer", false)).toBe(false);
    });
});
