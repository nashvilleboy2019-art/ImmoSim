// ---------------------------------------------------------------------------
// Budget courant — transforme le RAV après impôts en reste réellement libre.
// Reproduit l'onglet "Budget courant / RAV réel".
// ---------------------------------------------------------------------------
import type { BudgetCategorie, BudgetLine } from './types';

export interface BudgetResult {
  ravApresImpots: number;
  totalDepensesCourantes: number;
  totalProvisions: number;
  totalEpargne: number;
  resteApresDepenses: number;
  resteApresProvisions: number;
  resteLibreFinal: number;
  resteLibreParAdulte: number;
}

function totalCat(lines: BudgetLine[], cat: BudgetCategorie): number {
  return lines
    .filter((l) => l.actif && l.categorie === cat)
    .reduce((s, l) => s + l.montantMensuel, 0);
}

export function computeBudget(lines: BudgetLine[], ravApresImpots: number): BudgetResult {
  const totalDepensesCourantes = totalCat(lines, 'Dépenses courantes');
  const totalProvisions = totalCat(lines, 'Provisions');
  const totalEpargne = totalCat(lines, 'Épargne');
  const resteApresDepenses = ravApresImpots - totalDepensesCourantes;
  const resteApresProvisions = resteApresDepenses - totalProvisions;
  const resteLibreFinal = resteApresProvisions - totalEpargne;
  return {
    ravApresImpots,
    totalDepensesCourantes,
    totalProvisions,
    totalEpargne,
    resteApresDepenses,
    resteApresProvisions,
    resteLibreFinal,
    resteLibreParAdulte: resteLibreFinal / 2,
  };
}
