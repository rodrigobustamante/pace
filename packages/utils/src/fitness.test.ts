import {
  assessOverttrainingRisk,
  calculateFitness,
  calculateRunTSS,
  estimateThresholdHR,
  estimateWorkoutTSS,
  projectFitnessToDate,
} from "./fitness";

describe("fitness utils", () => {
  it("calculates CTL/ATL/TSB in date order", () => {
    const points = calculateFitness([
      { date: "2026-01-03", tss: 60 },
      { date: "2026-01-01", tss: 30 },
      { date: "2026-01-02", tss: 45 },
    ]);

    expect(points.map((p) => p.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
    ]);
    expect(points[2]).toMatchObject({ ctl: 3.2, atl: 17.2, tsb: -14.1 });
  });

  it("counts days without activity as zero load", () => {
    const points = calculateFitness([
      { date: "2026-01-01", tss: 100 },
      { date: "2026-01-04", tss: 100 },
    ]);

    expect(points.map((p) => p.date)).toEqual([
      "2026-01-01",
      "2026-01-02",
      "2026-01-03",
      "2026-01-04",
    ]);
    // Fatigue decays through the two rest days before the second run.
    expect(points[1]!.atl).toBeLessThan(points[0]!.atl);
    expect(points[2]!.atl).toBeLessThan(points[1]!.atl);
  });

  it("keeps decaying up to the given end date", () => {
    const points = calculateFitness([{ date: "2026-01-01", tss: 70 }], 0, 0, "2026-01-08");

    expect(points).toHaveLength(8);
    expect(points[7]!.date).toBe("2026-01-08");
    expect(points[7]!.atl).toBeLessThan(points[0]!.atl);
    expect(points[7]!.tsb).toBeGreaterThan(points[0]!.tsb);
  });

  it("returns no points without loads", () => {
    expect(calculateFitness([], 0, 0, "2026-01-08")).toEqual([]);
  });

  it("calculates run TSS and threshold HR", () => {
    expect(calculateRunTSS(3600, 160, 170)).toBe(88.6);
    expect(estimateThresholdHR(190)).toBe(169);
  });

  it("assesses danger and warning overtraining risk levels", () => {
    const danger = assessOverttrainingRisk(50, 90, -35, 8);
    expect(danger.level).toBe("danger");
    expect(danger.signals.length).toBeGreaterThan(0);

    const warning = assessOverttrainingRisk(40, 54, -22, 5);
    expect(warning.level).toBe("warning");

    const ok = assessOverttrainingRisk(50, 45, 5, 2);
    expect(ok.level).toBe("ok");
    expect(ok.signals).toEqual([]);
  });

  it("estimates workout TSS by type and zero-load days", () => {
    expect(estimateWorkoutTSS("tempo", 60)).toBe(81);
    expect(estimateWorkoutTSS("unknown", 45)).toBe(0);
    expect(estimateWorkoutTSS("easy", 0)).toBe(0);
  });

  it("projects fitness to race date using planned workouts", () => {
    const projection = projectFitnessToDate(
      45,
      55,
      "2026-02-01",
      "2026-02-05",
      [
        { date: "2026-02-01", workoutType: "easy", durationMin: 40 },
        { date: "2026-02-03", workoutType: "tempo", durationMin: 50 },
      ],
    );

    expect(projection).toEqual({
      projectedCTL: 42.2,
      projectedATL: 35.4,
      projectedTSB: 6.8,
    });
  });
});
