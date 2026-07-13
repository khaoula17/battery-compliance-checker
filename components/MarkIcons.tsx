// Illustrative marks & labels for the checker result. These are simplified,
// recognizable representations — NOT print-ready official artwork. They help the
// user see which marks/labels the shipment needs at a glance.

function LithiumBatteryMark() {
  return (
    <svg viewBox="0 0 100 70" className="h-16 w-24" role="img" aria-label="Lithium battery mark">
      <rect x="2" y="2" width="96" height="66" fill="#fff" stroke="#d11" strokeWidth="4" strokeDasharray="6 3" />
      <rect x="10" y="14" width="26" height="14" rx="2" fill="none" stroke="#111" strokeWidth="2" />
      <rect x="36" y="18" width="3" height="6" fill="#111" />
      <path d="M16 30 l-4 8 h5 l-2 6 6-8 h-5z" fill="#fbbf24" stroke="#111" strokeWidth="0.5" />
      <text x="50" y="52" textAnchor="middle" fontSize="9" fill="#111" fontWeight="bold">Lithium Battery</text>
      <text x="50" y="63" textAnchor="middle" fontSize="7" fill="#333">Handle with care</text>
    </svg>
  );
}

function Class9Label() {
  return (
    <svg viewBox="0 0 70 70" className="h-16 w-16" role="img" aria-label="Class 9 hazard label">
      <rect x="6" y="6" width="58" height="58" transform="rotate(45 35 35)" fill="#fff" stroke="#111" strokeWidth="2.5" />
      <g stroke="#111" strokeWidth="2">
        <line x1="24" y1="20" x2="46" y2="20" />
        <line x1="22" y1="24" x2="48" y2="24" />
        <line x1="21" y1="28" x2="49" y2="28" />
      </g>
      <path d="M28 42 h14" stroke="#111" strokeWidth="2" />
      <text x="35" y="55" textAnchor="middle" fontSize="14" fontWeight="bold" fill="#111">9</text>
    </svg>
  );
}

function CargoAircraftOnly() {
  return (
    <svg viewBox="0 0 100 60" className="h-16 w-24" role="img" aria-label="Cargo Aircraft Only label">
      <rect x="2" y="2" width="96" height="56" fill="#f59e0b" stroke="#111" strokeWidth="2" />
      <path d="M18 22 l20 6 12-8 4 3 -8 9 8 4 -3 4 -14-3 -12 9 -3-2 6-11z" fill="#111" />
      <text x="50" y="46" textAnchor="middle" fontSize="8" fontWeight="bold" fill="#111">CARGO AIRCRAFT ONLY</text>
    </svg>
  );
}

function GenericChip({ text }: { text: string }) {
  return (
    <span className="inline-flex items-center rounded border border-slate-300 bg-slate-50 px-2 py-3 text-xs text-slate-700">
      {text}
    </span>
  );
}

export function RequiredMarks({ marks, labels }: { marks: string[]; labels: string[] }) {
  const items = [...marks, ...labels];
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap items-end gap-4">
      {items.map((item, i) => {
        if (item.includes("Lithium battery mark")) return <LithiumBatteryMark key={i} />;
        if (item.includes("Class 9")) return <Class9Label key={i} />;
        if (item.includes("Cargo Aircraft Only")) return <CargoAircraftOnly key={i} />;
        return <GenericChip key={i} text={item} />;
      })}
    </div>
  );
}
