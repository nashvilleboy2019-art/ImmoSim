// ---------------------------------------------------------------------------
// Point d'entrée du moteur de calcul : agrège tous les modules à partir de
// l'état de simulation.
// ---------------------------------------------------------------------------
import { computeBudget, type BudgetResult } from './budget';
import { computeLoan, maxPrixFinancable, type LoanResult } from './loan';
import { computePatrimoine, type PatrimoineResult } from './patrimoine';
import { computeRAV, type RavResult } from './rav';
import { computeRentalTax, type RentalTaxResult } from './rentalTax';
import type { SimulationState } from './types';

export * from './types';
export * from './loan';
export * from './rentalTax';
export * from './rav';
export * from './budget';
export * from './patrimoine';
export * from './incomeTax';
export * from './finance';

export interface ComputedSimulation {
  loan: LoanResult;
  maxPrix: number;
  rental: RentalTaxResult;
  rav: RavResult;
  budget: BudgetResult;
  patrimoine: PatrimoineResult;
}

export function computeAll(state: SimulationState): ComputedSimulation {
  const loan = computeLoan(state.loan, state.properties);
  const maxPrix = maxPrixFinancable(state.loan, state.properties);
  const rental = computeRentalTax(state.properties, state.tax);
  const rav = computeRAV(state.loan, state.rav, loan, rental, state.properties, state.foyer);
  const budget = computeBudget(state.budget, rav.ravMensuelApres);
  const patrimoine = computePatrimoine(state.patrimoine);
  return { loan, maxPrix, rental, rav, budget, patrimoine };
}
