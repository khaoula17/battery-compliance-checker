// Central legal / company info. Edit these (or set the env vars) once and both
// the Terms and Privacy pages update. Fill the placeholders before you charge.
export const LEGAL = {
  company: process.env.NEXT_PUBLIC_COMPANY_NAME || "[Your Company / LLC name]",
  product: "ClearToShip",
  contactEmail: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "[your@email.com]",
  jurisdiction: process.env.NEXT_PUBLIC_JURISDICTION || "[your country / state]",
  siteUrl:
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://battery-compliance-checker-ap.vercel.app",
  lastUpdated: "July 2, 2026",
};
