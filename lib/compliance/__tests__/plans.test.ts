import { withinCheckLimit, canDownloadPdf, canUseApi, planFor } from "@/lib/plans";

describe("plan gating", () => {
  it("free plan: 5 checks/month, no PDF, no API", () => {
    expect(planFor("free").monthlyChecks).toBe(5);
    expect(withinCheckLimit("free", 4)).toBe(true);
    expect(withinCheckLimit("free", 5)).toBe(false);
    expect(canDownloadPdf("free")).toBe(false);
    expect(canUseApi("free")).toBe(false);
  });

  it("pro plan: unlimited checks, PDF, no API", () => {
    expect(withinCheckLimit("pro", 9999)).toBe(true);
    expect(canDownloadPdf("pro")).toBe(true);
    expect(canUseApi("pro")).toBe(false);
  });

  it("whitelabel plan: PDF + API", () => {
    expect(canDownloadPdf("whitelabel")).toBe(true);
    expect(canUseApi("whitelabel")).toBe(true);
  });

  it("unknown/undefined plan falls back to free", () => {
    expect(planFor(undefined).id).toBe("free");
    expect(planFor("nonsense").id).toBe("free");
  });
});
