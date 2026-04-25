import { predictAllRaces } from "./predictor";

describe("predictAllRaces", () => {
  it("returns predictions for standard distances from best activity", () => {
    const predictions = predictAllRaces([
      { distanceM: 5000, durationSec: 1500 },
      { distanceM: 10000, durationSec: 3300 },
      { distanceM: 3000, durationSec: 1200 },
    ]);

    expect(predictions).toHaveLength(4);
    expect(predictions[0]).toMatchObject({ distance: "5K", distanceM: 5000 });
    expect(predictions[3]).toMatchObject({ distance: "42K", distanceM: 42195 });
    expect(predictions[0]?.predictedTimeSec).toBeGreaterThan(0);
    expect(predictions[0]?.predictedTimeFormatted).toContain(":");
  });

  it("returns empty array when no valid source activity exists", () => {
    const predictions = predictAllRaces([
      { distanceM: 2500, durationSec: 900 },
      { distanceM: 5000, durationSec: 0 },
    ]);

    expect(predictions).toEqual([]);
  });
});
