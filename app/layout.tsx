import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  title: {
    default: "ClearToShip — ship lithium batteries by air without rejections",
    template: "%s · ClearToShip",
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
            <div className="mx-auto max-w-5xl px-4 py-3 flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
              <a href="/" className="font-semibold text-brand">
                🔋 ClearToShip
              </a>
              <nav className="text-sm text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                <a href="/check" className="hover:text-brand">Checker</a>
                <a href="/#pricing" className="hover:text-brand">Pricing</a>
                <a href="/changelog" className="hover:text-brand">Updates</a>
                <a href="/dashboard" className="hover:text-brand">Dashboard</a>
                <a href="/login" className="hover:text-brand">Sign in</a>
              </nav>
            </div>
          </header>
          <main className="flex-1">{children}</main>
          <footer className="border-t border-slate-200 bg-white">
            <div className="mx-auto max-w-5xl px-4 py-6 text-xs text-slate-500">
              <div className="mb-2 flex flex-wrap gap-4">
                <a href="/check" className="hover:text-brand">Checker</a>
                <a href="/batch" className="hover:text-brand">Batch</a>
                <a href="/changelog" className="hover:text-brand">Updates</a>
                <a href="/terms" className="hover:text-brand">Terms</a>
                <a href="/privacy" className="hover:text-brand">Privacy</a>
              </div>
              Built on the current IATA DGR / 49 CFR rules, with a citation for every
              result. Your certified shipper reviews and signs the final declaration.
              A pre-check tool — not legal advice.
            </div>
          </footer>
        </div>
        <Analytics />
      </body>
    </html>
  );
}
