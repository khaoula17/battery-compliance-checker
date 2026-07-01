import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getProfile } from "@/lib/db";
import { createAdminClient } from "@/lib/supabase/server";
import { rules } from "@/lib/compliance";

export const dynamic = "force-dynamic";

function adminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  if (!isSupabaseConfigured()) {
    return <Gate msg="Admin requires Supabase to be configured." />;
  }
  const profile = await getProfile();
  if (!profile) redirect("/login");
  if (!adminEmails().includes((profile.email ?? "").toLowerCase())) {
    return <Gate msg="You don't have admin access. Set ADMIN_EMAILS to include your email." />;
  }

  const admin = createAdminClient();
  let users: any[] = [];
  if (admin) {
    const { data } = await admin
      .from("profiles")
      .select("email, plan, created_at")
      .order("created_at", { ascending: false })
      .limit(100);
    users = data ?? [];
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900">Admin</h1>

      <section className="mt-6 rounded-lg border border-slate-200 bg-white p-5">
        <h2 className="font-semibold text-slate-900">Active ruleset</h2>
        <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm">
          <dt className="text-slate-500">Version</dt><dd>{rules.version}</dd>
          <dt className="text-slate-500">Edition</dt><dd>{rules.edition}</dd>
          <dt className="text-slate-500">Effective</dt><dd>{rules.effectiveDate}</dd>
          <dt className="text-slate-500">Last reviewed</dt><dd>{rules.lastReviewed}</dd>
        </dl>
        <p className="mt-3 text-xs text-slate-500">
          To update rules, edit <code>lib/compliance/rules/li-rules.json</code>, bump the version, and redeploy.
        </p>
      </section>

      <section className="mt-6">
        <h2 className="font-semibold text-slate-900">Users ({users.length})</h2>
        <div className="mt-3 overflow-hidden rounded-lg border border-slate-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-slate-500">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-4 py-2 font-medium">Plan</th>
                <th className="px-4 py-2 font-medium">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={i} className="border-t border-slate-100">
                  <td className="px-4 py-2">{u.email}</td>
                  <td className="px-4 py-2">{u.plan}</td>
                  <td className="px-4 py-2 text-slate-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Gate({ msg }: { msg: string }) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 text-center">
      <h1 className="text-2xl font-bold">Admin</h1>
      <p className="mt-3 text-sm text-slate-600">{msg}</p>
    </div>
  );
}
