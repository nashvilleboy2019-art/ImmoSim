// ---------------------------------------------------------------------------
// Utilitaires financiers de base.
// ---------------------------------------------------------------------------

/**
 * Mensualité d'un prêt amortissable (équivalent à -PMT(rate, nper, pv) d'Excel).
 * @param ratePerPeriod taux périodique (ex: taux annuel / 12)
 * @param nper nombre de périodes
 * @param pv capital emprunté
 * @returns mensualité positive
 */
export function pmt(ratePerPeriod: number, nper: number, pv: number): number {
  if (nper <= 0) return 0;
  if (ratePerPeriod === 0) return pv / nper;
  const f = Math.pow(1 + ratePerPeriod, nper);
  return (pv * ratePerPeriod * f) / (f - 1);
}

/** Arrondi à n décimales pour l'affichage des calculs internes. */
export function round(value: number, decimals = 2): number {
  const m = Math.pow(10, decimals);
  return Math.round((value + Number.EPSILON) * m) / m;
}
