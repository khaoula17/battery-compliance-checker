// Real testimonials from pilot users. Add entries here as you collect them —
// the landing "trusted by" section renders ONLY when this array is non-empty,
// so no fake social proof ever ships.
export interface Testimonial {
  quote: string;
  name: string;
  role: string; // e.g. "DG Manager, Acme Freight"
}

export const TESTIMONIALS: Testimonial[] = [
  // Example (delete and replace with a real one):
  // { quote: "Caught a 30% state-of-charge issue before it cost us a rejection.",
  //   name: "Jane D.", role: "DG Manager, Acme Freight" },
];
