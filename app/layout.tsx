import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "Battery Compliance Checker — ship lithium batteries by air without rejections",
    template: "%s · Battery Compliance Checker",
  },
  description:
    "Instantly check lithium-battery air shipments against IATA DGR. Get the UN number, packing instruction, required marks/labels and a clear pass/fail with fixes — before the carrier rejects your shipment. Free to try, no signup.",
  keywords: [
    "lithium battery shipping",
    "IATA DGR",
    "dangerous goods declaration",
    "UN3480",
    "UN3481",
    "DGD",
    "49 CFR 173.185",
    "shipping compliance",
    "lithium battery air freight",
  ],
  openGraph: {
    title: "Ship lithium batteries by air without rejections",
    description:
      "Pre-flight IATA DGR check: classification, marks/labels, carrier variations, and fixes — in seconds.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex flex-col">
          <header className="border-b border-slate-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
              <a href="/" className="font-semibold text-brand">
                🔋 Battery Compliance Checker
              </a>
              <nav className="text-sm text-slate-600 flex gap-4">
                <a href="/check" className="hover:text-brand">Checker</a>
                <a href="/#pricing" className="hover:text-brand">Pricing</a>
                <a href="/dashboard" className="hover:text-brand">Dashboard</a>
                <a href="/login" className="hover:text-brand">Sign in</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
              For pre-flight checking only. Not legal advice. A trained, certified
              shipper is responsible for the final Shipper&apos;s Declaration. Always
              verify against the current IATA DGR / 49 CFR and carrier variations.
            </div>
          </footer>
        </div>
      </body>
    </html>
  );
}
