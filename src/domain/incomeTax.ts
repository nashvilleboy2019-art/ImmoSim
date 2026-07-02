// ---------------------------------------------------------------------------
// Impôt sur le revenu (salaires) — barème progressif utilisé dans l'onglet
// "RAV avant-après impôts". Barème indicatif 2026 repris de l'Excel.
// ---------------------------------------------------------------------------

/** Tranches du barème par part (revenu après abattement). */
const BRACKETS = [
  { upTo: 11600, rate: 0 },
  { upTo: 29579, rate: 0.11 },
  { upTo: 84577, rate: 0.3 },
  { upTo: 181917, rate: 0.41 },
  { upTo: Infinity, rate: 0.45 },
];

/** Impôt pour un revenu imposable donné (1 part), barème progressif. */
export function taxForOnePart(taxableIncome: number): number {
  let tax = 0;
  let prev = 0;
  for (const b of BRACKETS) {
    if (taxableIncome <= prev) break;
    const taxable = Math.min(taxableIncome, b.upTo) - prev;
    tax += Math.max(0, taxable) * b.rate;
    prev = b.upTo;
  }
  return tax;
}

/** Impôt par quotient familial : impôt(base / parts) × parts. */
export function taxWithParts(taxableIncome: number, parts: number): number {
  return taxForOnePart(taxableIncome / parts) * parts;
}
