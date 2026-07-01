import { generateDgdPdf } from "../dgd";
import { runCheck } from "@/lib/compliance";

describe("generateDgdPdf", () => {
  it("produces a non-empty PDF for a passing shipment", async () => {
    const result = runCheck({
      chemistry: "ion",
      configuration: "standalone",
      itemType: "battery",
      whPerUnit: 50,
      operator: "GENERIC",
      stateOfChargePct: 25,
      un38_3TestSummaryAvailable: true,
      whMarkedOnCase: true,
    });
    const pdf = await generateDgdPdf(result, { shipperName: "Acme", consigneeName: "Buyer" });
    expect(pdf.length).toBeGreaterThan(1000);
    // PDF magic bytes "%PDF"
    expect(Buffer.from(pdf.slice(0, 4)).toString()).toBe("%PDF");
  });

  it("produces a PDF for a blocked (Section IA) shipment too", async () => {
    const result = runCheck({
      chemistry: "ion",
      configuration: "standalone",
      itemType: "battery",
      whPerUnit: 250,
      operator: "FEDEX",
      un38_3TestSummaryAvailable: false,
    });
    const pdf = await generateDgdPdf(result);
    expect(Buffer.from(pdf.slice(0, 4)).toString()).toBe("%PDF");
  });
});
