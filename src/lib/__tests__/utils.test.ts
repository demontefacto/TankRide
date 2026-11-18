import { describe, expect, it } from "vitest";
import { calculateConsumptionSimple, calculateConsumptionSmart } from "../utils";

describe("calculateConsumptionSimple", () => {
  it("calculates l/100km for positive distance", () => {
    expect(calculateConsumptionSimple(40, 1000, 1500)).toBeCloseTo(8.0);
  });

  it("returns null for non-positive distance", () => {
    expect(calculateConsumptionSimple(40, 1500, 1500)).toBeNull();
  });
});

describe("calculateConsumptionSmart", () => {
  it("sorts entries on the same date by odometer ascending", () => {
    const sameDay = new Date("2026-10-15T00:00:00Z");
    const entries = [
      {
        id: "second",
        vehicleId: "v1",
        date: sameDay,
        odometer: 1500,
        quantity: 35,
        fullTank: true,
        fuelLevelPct: 100,
      },
      {
        id: "first",
        vehicleId: "v1",
        date: sameDay,
        odometer: 1000,
        quantity: 40,
        fullTank: true,
        fuelLevelPct: 100,
      },
    ];

    const res = calculateConsumptionSmart(entries, 50);
    expect(res.get("first")).toBeNull();
    expect(res.get("second")).toBeCloseTo(7.0);
  });
});
