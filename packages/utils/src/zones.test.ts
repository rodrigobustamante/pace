import { zoneDistribution } from "./zones";

describe("zoneDistribution", () => {
  it("aggregates minutes by estimated avg-HR zone", () => {
    const distribution = zoneDistribution(
      [
        { durationSec: 1800, avgHRbpm: 110 }, // z1, 30 min
        { durationSec: 1200, avgHRbpm: 135 }, // z2, 20 min
        { durationSec: 600, avgHRbpm: 165 }, // z4, 10 min
      ],
      200,
    );

    expect(distribution).toEqual({
      z1: 30,
      z2: 20,
      z3: 0,
      z4: 10,
      z5: 0,
    });
  });

  it("ignores activities without HR and rounds decimals", () => {
    const distribution = zoneDistribution(
      [
        { durationSec: 1000, avgHRbpm: 150 }, // z3, 16.666...
        { durationSec: 1000, avgHRbpm: null },
      ],
      200,
    );

    expect(distribution).toEqual({
      z1: 0,
      z2: 0,
      z3: 16.7,
      z4: 0,
      z5: 0,
    });
  });
});
