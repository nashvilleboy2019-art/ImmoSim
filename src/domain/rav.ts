// ---------------------------------------------------------------------------
// Reste à vivre consolidé avant / après impôts.
// Reproduit l'onglet "RAV avant-après impôts".
// ---------------------------------------------------------------------------
import { taxWithParts } from './incomeTax';
import {
  nomPersonne,
  partsEnfants,
  type Foyer,
  type LoanParams,
  type Property,
  type RavParams,
} from './types';
import type { RentalTaxResult } from './rentalTax';
import type { LoanResult } from './loan';

export interface PersonneSalaire {
  nom: string;
  brutMensuel: number;
  brutAnnuel: number;
  baseIR: number;
  parts: number;
  irAnnuel: number;
  irMensuel: number;
  netMensuel: number;
}

export interface RavLigne {
  libelle: string;
  avant: number;
  apres: number;
}

export interface RavResult {
  salaires: PersonneSalaire[];
  irSalaireMensuel: number;
  brutSalaireMensuel: number;
  netSalaireMensuel: number;
  // Locatif
  recettesHCMensuel: number;
  chargesCashMensuel: number;
  impotsLocatifMensuel: number;
  netLocatifMensuel: number;
  capitalApproxApparts: number;
  contributionLocativeNette: number;
  // Vue consolidée
  lignes: RavLigne[];
  ravMensuelAvant: number;
  ravMensuelApres: number;
  nbPersonnes: number;
  ravParPersonneApres: number;
  totalImpotsMensuels: number;
}

/**
 * Impôt d'un foyer avec quotient familial plafonné.
 * @param baseIR revenu imposable annuel
 * @param baseParts parts hors enfants (1 célibataire, 2 couple, +0,5 si parent isolé)
 * @param childParts demi-parts apportées par les enfants
 * @param plafond plafond de l'avantage par demi-part enfant (€/an)
 */
function householdTax(baseIR: number, baseParts: number, childParts: number, plafond: number): number {
  const pFull = taxWithParts(baseIR, baseParts + childParts);
  if (childParts <= 0) return pFull;
  // Plafonnement : l'avantage des demi-parts enfants est limité.
  const pBase = taxWithParts(baseIR, baseParts);
  const cap = (childParts / 0.5) * plafond;
  return Math.max(pFull, pBase - cap);
}

export function computeRAV(
  loan: LoanParams,
  rav: RavParams,
  loanResult: LoanResult,
  rental: RentalTaxResult,
  properties: Property[],
  foyer: Foyer,
): RavResult {
  const commun = rav.modeFiscal === 'Commun';
  const pEnfants = partsEnfants(rav.nbEnfants);

  const noms = [nomPersonne(foyer, 0), nomPersonne(foyer, 1)];
  const bruts = [loan.revenuBancaireA, loan.revenuBancaireB];

  const salaires: PersonneSalaire[] = [];
  if (!commun) {
    noms.forEach((nom, i) => {
      const brutMensuel = bruts[i];
      const brutAnnuel = brutMensuel * 12;
      const baseIR = brutAnnuel * (1 - rav.abattementFraisPro);
      const rattache =
        rav.nbEnfants > 0 && rav.rattachementEnfant === (i === 0 ? 'A' : 'B');
      const childParts = rattache ? pEnfants : 0;
      // Parent isolé : demi-part supplémentaire (case T) pour le parent rattachant.
      const baseParts = 1 + (rattache && rav.parentIsole ? 0.5 : 0);
      const irAnnuel = householdTax(baseIR, baseParts, childParts, rav.plafondDemiPartEnfant);
      salaires.push({
        nom,
        brutMensuel,
        brutAnnuel,
        baseIR,
        parts: baseParts + childParts,
        irAnnuel,
        irMensuel: irAnnuel / 12,
        netMensuel: brutMensuel - irAnnuel / 12,
      });
    });
  } else {
    const brutMensuel = bruts[0] + bruts[1];
    const brutAnnuel = brutMensuel * 12;
    const baseIR = brutAnnuel * (1 - rav.abattementFraisPro);
    const irAnnuel = householdTax(baseIR, 2, pEnfants, rav.plafondDemiPartEnfant);
    salaires.push({
      nom: 'Foyer commun',
      brutMensuel,
      brutAnnuel,
      baseIR,
      parts: 2 + pEnfants,
      irAnnuel,
      irMensuel: irAnnuel / 12,
      netMensuel: brutMensuel - irAnnuel / 12,
    });
  }

  const brutSalaireMensuel = bruts[0] + bruts[1];
  const irSalaireMensuel = salaires.reduce((s, p) => s + p.irMensuel, 0);
  const netSalaireMensuel = brutSalaireMensuel - irSalaireMensuel;

  // --- Locatif ---
  const recettesHCMensuel = rental.recettesHC / 12;
  const chargesCashMensuel = rental.chargesCash / 12;
  const impotsLocatifMensuel = rental.impotsTotal / 12;
  const netLocatifMensuel = rental.cashNetMensuel;

  // Appartements avec un crédit existant (le studio n'en a pas).
  const apparts = properties.filter((p) => p.mensualiteCreditActuel > 0);
  const interetsAppartsMensuel = apparts.reduce((s, p) => s + p.interetsEmprunt, 0) / 12;
  const pretsApparts = apparts.reduce((s, p) => s + p.mensualiteCreditActuel, 0);
  const capitalApproxApparts = Math.max(0, pretsApparts - interetsAppartsMensuel);

  // Le studio est le bien sans crédit existant ; quote-part d'intérêts du prêt RP.
  const studio = properties.find((p) => p.mensualiteCreditActuel === 0);
  const interetsStudioMensuel = studio ? studio.interetsEmprunt / 12 : 0;

  const contributionLocativeNette =
    netLocatifMensuel - capitalApproxApparts - rav.provisionStudioHorsModele;

  const pretRP = Math.max(0, loanResult.mensualiteMaison - interetsStudioMensuel);

  // --- Vue consolidée avant / après impôts ---
  const lignes: RavLigne[] = [
    { libelle: 'Salaires', avant: brutSalaireMensuel, apres: netSalaireMensuel },
    {
      libelle: 'Locatif total avant prêts',
      avant: recettesHCMensuel - chargesCashMensuel,
      apres: netLocatifMensuel,
    },
    {
      libelle: 'Capital prêts appartements',
      avant: -capitalApproxApparts,
      apres: -capitalApproxApparts,
    },
    { libelle: 'Prêt résidence principale', avant: -pretRP, apres: -pretRP },
    {
      libelle: 'Autres charges fixes',
      avant: -rav.autresChargesFixesMensuelles,
      apres: -rav.autresChargesFixesMensuelles,
    },
    {
      libelle: 'Provision studio hors modèle',
      avant: -rav.provisionStudioHorsModele,
      apres: -rav.provisionStudioHorsModele,
    },
  ];

  const ravMensuelAvant = lignes.reduce((s, l) => s + l.avant, 0);
  const ravMensuelApres = lignes.reduce((s, l) => s + l.apres, 0);
  const nbPersonnes = 2 + Math.max(0, Math.floor(rav.nbEnfants));

  return {
    salaires,
    irSalaireMensuel,
    brutSalaireMensuel,
    netSalaireMensuel,
    recettesHCMensuel,
    chargesCashMensuel,
    impotsLocatifMensuel,
    netLocatifMensuel,
    capitalApproxApparts,
    contributionLocativeNette,
    lignes,
    ravMensuelAvant,
    ravMensuelApres,
    nbPersonnes,
    ravParPersonneApres: ravMensuelApres / nbPersonnes,
    totalImpotsMensuels: irSalaireMensuel + impotsLocatifMensuel,
  };
}
