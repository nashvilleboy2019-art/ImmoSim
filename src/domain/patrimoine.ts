// ---------------------------------------------------------------------------
// Patrimoine net — agrège les actifs et dettes (onglet "Patrimoine").
// ---------------------------------------------------------------------------
import type { PatrimoineItem } from './types';

export interface PatrimoineResult {
  liquidites: number;
  placements: number;
  immobilier: number;
  dettes: number;
  actifsTotaux: number;
  patrimoineNet: number;
  patrimoineFinancierNet: number; // hors immobilier
}

export function computePatrimoine(items: PatrimoineItem[]): PatrimoineResult {
  const sum = (t: PatrimoineItem['type']) =>
    items.filter((i) => i.type === t).reduce((s, i) => s + i.montant, 0);
  const liquidites = sum('liquidites');
  const placements = sum('placement');
  const immobilier = sum('immobilier');
  const dettes = sum('dette');
  const actifsTotaux = liquidites + placements + immobilier;
  return {
    liquidites,
    placements,
    immobilier,
    dettes,
    actifsTotaux,
    patrimoineNet: actifsTotaux - dettes,
    patrimoineFinancierNet: liquidites + placements,
  };
}
