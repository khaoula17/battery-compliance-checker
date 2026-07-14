import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile, countChecksThisMonth, listChecks, type SavedCheck, type Profile } from "@/lib/db";
import { planFor } from "@/lib/plans";
import { ManageBillingButton } from "@/components/billing";
import { ApiKeys } from "@/components/ApiKeys";
import { runCheck } from "@/lib/compliance";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  // Demo mode: when Supabase isn't connected, show the dashboard with sample
  // data so you can see exactly how it works. Connect Supabase to make it live.
  if (!isSupabaseConfigured()) {
    return <DashboardView demo profile={DEMO_PROFILE} used={DEMO_USED} checks={demoChecks()} />;
  }

  const profile = await getProfile();
  if (!profile) redirect("/login");
  const [used, checks] = await Promise.all([
    countChecksThisMonth(profile.id),
    listChecks(profile.id, 20),
  ]);
  return <DashboardView profile={profile} used={used} checks={checks} />;
}

function DashboardView({
  profile,
  used,
  checks,
  demo = false,
}: {
  profile: Profile;
  used: number;
  checks: SavedCheck[];
  demo?: boolean;
}) {
  const plan = planFor(profile.plan);
  const limitLabel = plan.monthlyChecks === null ? "Unlimited" : `${used} / ${plan.monthlyChecks}`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      {demo && (
        <div className="mb-6 rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          <strong>Demo mode.</strong> This is sample data so you can preview the dashboard.
          Connect Supabase (add 3 keys to <code>.env.local</code>) to make accounts, saved
          checks, and billing live.
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        {!demo && (
          <form action="/auth/signout" method="post">
            <button className="text-sm text-slate-500 hover:text-slate-800">Sign out</button>
          </form>
        )}
      </div>
      <p className="mt-1 text-sm text-slate-600">{profile.email}</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <Stat label="Plan" value={plan.name} />
        <Stat label="Checks this month" value={limitLabel} />
        <Stat label="Saved checks" value={String(checks.length)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <a href="/check" className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark">
          New check
        </a>
        {profile.plan === "free" ? (
          <a href="/#pricing" className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400">
            Upgrade
          </a>
        ) : (
          <ManageBillingButton className="rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:border-slate-400" />
        )}
      </div>

      <h2 className="mt-10 text-lg font-semibold text-slate-900">Recent checks</h2>
      <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
        {checks.length === 0 ? (
          <p className="p-6 text-sm text-slate-500">No checks yet. Run your first one.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Date</th>
                <th className="px-4 py-2 font-medium">UN</th>
                <th className="px-4 py-2 font-medium">Section</th>
                <th className="px-4 py-2 font-medium">Carrier</th>
                <th className="px-4 py-2 font-medium">Result</th>
                <th className="px-4 py-2 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {checks.map((c) => (
                <tr key={c.id} className="border-t border-slate-100">
                  <td className="px-4 py-2 text-slate-500">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-4 py-2">{c.result.classification.unNumber}</td>
                  <td className="px-4 py-2">{c.result.classification.section}</td>
                  <td className="px-4 py-2">{c.operator ?? "GENERIC"}</td>
                  <td className="px-4 py-2">
                    <span className={c.passed ? "text-emerald-700" : "text-red-700"}>
                      {c.passed ? "Pass" : "Blocked"}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <a
                      href={`/check?input=${encodeURIComponent(Buffer.from(JSON.stringify(c.input)).toString("base64"))}`}
                      className="text-brand hover:underline"
                    >
                      Reuse
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {!demo && (
        <div className="mt-8">
          <ApiKeys />
        </div>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-xl font-bold text-slate-900">{value}</div>
    </div>
  );
}

// ---- Demo data (only used when Supabase is not connected) ----
const DEMO_PROFILE: Profile = {
  id: "demo",
  email: "demo@yourcompany.com",
  plan: "pro",
  stripe_customer_id: null,
};
const DEMO_USED = 12;

function demoChecks(): SavedCheck[] {
  const samples = [
    { chemistry: "ion" as const, configuration: "standalone" as const, itemType: "battery" as const, whPerUnit: 50, operator: "FEDEX" as const, stateOfChargePct: 25, un38_3TestSummaryAvailable: true, whMarkedOnCase: true },
    { chemistry: "ion" as const, configuration: "contained_in_equipment" as const, itemType: "battery" as const, whPerUnit: 40, operator: "DHL" as const, stateOfChargePct: 20, un38_3TestSummaryAvailable: true },
    { chemistry: "ion" as const, configuration: "standalone" as const, itemType: "battery" as const, whPerUnit: 220, operator: "UPS" as const, stateOfChargePct: 80, un38_3TestSummaryAvailable: true }, // blocked: SoC > 30%
    { chemistry: "metal" as const, configuration: "standalone" as const, itemType: "battery" as const, lithiumContentG: 1.5, operator: "GENERIC" as const, un38_3TestSummaryAvailable: false }, // blocked: no UN 38.3
  ];
  return samples.map((input, i) => {
    const result = runCheck(input);
    return {
      id: `demo-${i}`,
      input,
      result,
      operator: input.operator ?? "GENERIC",
      passed: result.passed,
      created_at: new Date(Date.now() - i * 86400000).toISOString(),
    };
  });
}
