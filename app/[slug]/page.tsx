import { notFound } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getDomain } from "@/lib/db";
import CheckPage from "@/app/check/page";

// White-label portal for 3PLs: /<slug> renders a branded version of the checker.
// The 3PL is configured in the `domains` table (slug, display_name, brand_color).
// Explicit routes (/check, /login, /dashboard, /admin, /api...) take priority
// over this dynamic segment.
export const dynamic = "force-dynamic";

export default async function WhiteLabelPortal({
  params,
}: {
  params: { slug: string };
}) {
  if (!isSupabaseConfigured()) notFound();
  const domain = await getDomain(params.slug);
  if (!domain) notFound();

  const color = domain.brand_color || "#0f766e";
  return (
    <div>
      <div style={{ backgroundColor: color }} className="text-white">
        <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
          <span className="font-semibold">{domain.display_name}</span>
          <span className="text-xs opacity-80">Lithium battery compliance check</span>
        </div>
      </div>
      <CheckPage />
      <p className="mx-auto max-w-5xl px-4 pb-8 text-xs text-slate-400">
        Powered by Battery Compliance Checker.
      </p>
    </div>
  );
}
