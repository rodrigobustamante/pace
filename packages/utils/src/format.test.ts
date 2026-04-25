import {
  hrZone,
  mToKm,
  predictRaceTime,
  secToDuration,
  secToPace,
  tsbLabel,
} from "./format";

describe("format utils", () => {
  it("formats meters and pace", () => {
    expect(mToKm(12345)).toBe("12.3");
    expect(secToPace(332)).toBe("5:32");
  });

  it("formats duration with and without hours", () => {
    expect(secToDuration(3599)).toBe("59:59");
    expect(secToDuration(3601)).toBe("1:00:01");
  });

  it("maps tsb labels by range", () => {
    expect(tsbLabel(-25)).toBe("Sobreentrenado");
    expect(tsbLabel(-15)).toBe("Muy fatigado");
    expect(tsbLabel(-7)).toBe("Algo fatigado");
    expect(tsbLabel(0)).toBe("Equilibrado");
    expect(tsbLabel(10)).toBe("Fresco");
    expect(tsbLabel(20)).toBe("Muy descansado");
  });

  it("classifies heart rate zones on boundaries", () => {
    expect(hrZone(119, 200)).toBe(1);
    expect(hrZone(120, 200)).toBe(2);
    expect(hrZone(140, 200)).toBe(3);
    expect(hrZone(160, 200)).toBe(4);
    expect(hrZone(180, 200)).toBe(5);
  });

  it("predicts race time with Riegel formula", () => {
    expect(predictRaceTime(1500, 5000, 10000)).toBe(3127);
  });
});
