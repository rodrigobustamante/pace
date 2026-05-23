import { zoneDistribution, calculateFeel, feelLabel, feelColor } from "./zones";

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

describe("calculateFeel", () => {
  // maxHR = 200 for easy math: Z1 <120, Z2 120-139, Z3 140-159, Z4 160-179, Z5 ≥180
  const MAX_HR = 200;

  it("returns 1 for Z1 effort", () => {
    expect(calculateFeel(110, MAX_HR)).toBe(1);
  });

  it("returns 2 for Z2 effort", () => {
    expect(calculateFeel(130, MAX_HR)).toBe(2);
  });

  it("returns 3 for Z3 effort", () => {
    expect(calculateFeel(150, MAX_HR)).toBe(3);
  });

  it("returns 4 for Z4 effort", () => {
    expect(calculateFeel(170, MAX_HR)).toBe(4);
  });

  it("returns 5 for Z5 effort", () => {
    expect(calculateFeel(185, MAX_HR)).toBe(5);
  });

  it("returns null when avgHRbpm is null", () => {
    expect(calculateFeel(null, MAX_HR)).toBeNull();
  });

  it("returns null when maxHR is null", () => {
    expect(calculateFeel(150, null)).toBeNull();
  });

  it("returns null when maxHR is 0", () => {
    expect(calculateFeel(150, 0)).toBeNull();
  });
});

describe("feelLabel", () => {
  it("maps 1–5 to Spanish labels", () => {
    expect(feelLabel(1)).toBe("Muy fácil");
    expect(feelLabel(2)).toBe("Fácil");
    expect(feelLabel(3)).toBe("Moderado");
    expect(feelLabel(4)).toBe("Duro");
    expect(feelLabel(5)).toBe("Máximo");
  });
});

describe("feelColor", () => {
  it("returns blue for 1 and red for 5", () => {
    expect(feelColor(1)).toBe("#60a5fa");
    expect(feelColor(5)).toBe("#ef4444");
  });
});
