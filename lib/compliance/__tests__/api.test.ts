// Integration test: invoke the API route handlers directly (no Next server boot).
import { POST as checkPOST } from "@/app/api/check/route";
import { POST as labelsPOST } from "@/app/api/v1/labels/route";

function jsonReq(body: unknown, headers: Record<string, string> = {}) {
  return new Request("http://localhost/api", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...headers },
    body: JSON.stringify(body),
  });
}

describe("/api/check route", () => {
  it("classifies FedEx standalone lithium-ion as Section IB with a carrier-approval warning", async () => {
    const res = await checkPOST(
      jsonReq({
        chemistry: "ion",
        configuration: "standalone",
        itemType: "battery",
        whPerUnit: 50,
        operator: "FEDEX",
        stateOfChargePct: 25,
        un38_3TestSummaryAvailable: true,
        whMarkedOnCase: true,
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.classification.unNumber).toBe("UN3480");
    expect(data.classification.section).toBe("IB"); // no Section II for standalone since 2022
    expect(data.findings.map((f: any) => f.code)).toContain("OPERATOR_STANDALONE_APPROVAL");
  });

  it("400s on missing required fields", async () => {
    const res = await checkPOST(jsonReq({ chemistry: "ion" }));
    expect(res.status).toBe(400);
  });
});

describe("/api/v1/labels route", () => {
  it("batch-checks multiple shipments", async () => {
    const res = await labelsPOST(
      jsonReq({
        shipments: [
          { chemistry: "ion", configuration: "contained_in_equipment", itemType: "battery", whPerUnit: 50, operator: "GENERIC", un38_3TestSummaryAvailable: true, whMarkedOnCase: true, stateOfChargePct: 20 },
          { chemistry: "ion", configuration: "standalone", itemType: "battery", whPerUnit: 200, operator: "GENERIC", un38_3TestSummaryAvailable: true },
        ],
      })
    );
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.count).toBe(2);
    expect(data.results[0].classification.section).toBe("II"); // in equipment, within limits
    expect(data.results[1].classification.section).toBe("IA"); // standalone over threshold
  });
});
