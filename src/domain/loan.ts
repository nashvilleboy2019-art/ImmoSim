// ---------------------------------------------------------------------------
// Capacité d'emprunt — reproduit l'onglet "Synthese" de l'Excel.
// ---------------------------------------------------------------------------
import { pmt } from './finance';
import type { LoanParams, MethodeCalcul, Property } from './types';

/** Statut bancaire : sous le seuil, dans la marge de flexibilité, ou au-delà. */
export type StatutBancaire = 'ok' | 'derogation' | 'alerte';

/** Marge de flexibilité au-dessus du taux max (HCSF) avant l'alerte rouge. */
export const MARGE_DEROGATION = 0.05;

export interface LoanResult {
  fraisNotaire: number;
  coutTotal: number;
  besoinFinancement: number;
  ptzRetenu: number;
  pretClassique: number;
  mensualiteClassique: number;
  mensualitePtz: number;
  assuranceMensuelle: number;
  mensualiteMaison: number;
  methode: MethodeCalcul;
  revenusBancairesCouple: number;
  loyersRetenusBanque: number;
  mensualitesAppartsExistants: number;
  autresMensualitesCredits: number;
  revenusLocatifsNets: number; // différentiel : somme des soldes positifs
  chargesLocativesNettes: number; // différentiel : somme des déficits
  revenusRetenus: number; // base de revenus retenue par la méthode
  capaciteBrute35: number; // taux max × revenus retenus
  effetNetApparts: number;
  capaciteRestante: number;
  margeBancaire: number;
  tauxEffortGlobal: number;
  gainMensuelPtz: number;
  statut: StatutBancaire;
  financable: boolean;
}

export function computeLoan(loan: LoanParams, properties: Property[]): LoanResult {
  const fraisNotaire = loan.prixBien * loan.fraisNotairePct;
  const coutTotal = loan.prixBien + fraisNotaire;
  const besoinFinancement = Math.max(0, coutTotal - loan.apport);

  const ptzRetenu = loan.ptzActif ? Math.min(loan.ptzMontant, besoinFinancement) : 0;
  const pretClassique = Math.max(0, besoinFinancement - ptzRetenu);

  const r = loan.tauxNominalAnnuel / 12;
  const n = loan.dureeAnnees * 12;
  const mensualiteClassique = pmt(r, n, pretClassique);
  const mensualitePtz = ptzRetenu > 0 ? ptzRetenu / (loan.ptzDureeAnnees * 12) : 0;
  const assuranceMensuelle = (besoinFinancement * loan.assuranceAnnuellePct) / 12;
  const mensualiteMaison = mensualiteClassique + mensualitePtz + assuranceMensuelle;

  const revenusBancairesCouple = loan.revenuBancaireA + loan.revenuBancaireB;

  const loyersBruts = properties.reduce((s, p) => s + p.loyerMensuel, 0);
  const loyersRetenusBanque = loyersBruts * loan.decoteLoyers;
  const mensualitesAppartsExistants = properties.reduce(
    (s, p) => s + p.mensualiteCreditActuel,
    0,
  );
  const autresMensualitesCredits = Math.max(0, loan.autresMensualitesCredits);
  const methode: MethodeCalcul = loan.methodeCalcul ?? 'classique';

  // --- Lecture des locations selon la méthode bancaire ---
  let revenusLocatifsNets = 0; // soldes positifs (différentiel)
  let chargesLocativesNettes = 0; // déficits (différentiel)
  let revenusRetenus: number;
  let chargesExistantes: number;
  if (methode === 'differentiel') {
    for (const pr of properties) {
      const net = pr.loyerMensuel * loan.decoteLoyers - pr.mensualiteCreditActuel;
      if (net >= 0) revenusLocatifsNets += net;
      else chargesLocativesNettes += -net;
    }
    revenusRetenus = revenusBancairesCouple + revenusLocatifsNets;
    chargesExistantes = chargesLocativesNettes + autresMensualitesCredits;
  } else {
    // classique : loyers pondérés ajoutés aux revenus, crédits aux charges.
    revenusRetenus = revenusBancairesCouple + loyersRetenusBanque;
    chargesExistantes = mensualitesAppartsExistants + autresMensualitesCredits;
  }

  const capaciteBrute35 = revenusRetenus * loan.tauxEndettementMax;
  const effetNetApparts = loyersRetenusBanque - mensualitesAppartsExistants;
  const capaciteRestante = capaciteBrute35 - chargesExistantes;
  const margeBancaire = capaciteRestante - mensualiteMaison;
  const tauxEffortGlobal =
    revenusRetenus > 0 ? (mensualiteMaison + chargesExistantes) / revenusRetenus : 0;

  const seuilDerogation = loan.tauxEndettementMax + MARGE_DEROGATION;
  const statut: StatutBancaire =
    tauxEffortGlobal <= loan.tauxEndettementMax
      ? 'ok'
      : tauxEffortGlobal <= seuilDerogation
        ? 'derogation'
        : 'alerte';

  // Gain mensuel grâce au PTZ : mensualité sans PTZ - mensualité avec PTZ.
  const mensualiteSansPtz = pmt(r, n, besoinFinancement) + assuranceMensuelle;
  const gainMensuelPtz = mensualiteSansPtz - mensualiteMaison;

  return {
    fraisNotaire,
    coutTotal,
    besoinFinancement,
    ptzRetenu,
    pretClassique,
    mensualiteClassique,
    mensualitePtz,
    assuranceMensuelle,
    mensualiteMaison,
    methode,
    revenusBancairesCouple,
    loyersRetenusBanque,
    mensualitesAppartsExistants,
    autresMensualitesCredits,
    revenusLocatifsNets,
    chargesLocativesNettes,
    revenusRetenus,
    capaciteBrute35,
    effetNetApparts,
    capaciteRestante,
    margeBancaire,
    tauxEffortGlobal,
    gainMensuelPtz,
    statut,
    financable: statut !== 'alerte',
  };
}

/** Prix maximal finançable en gardant la marge bancaire >= 0, à apport fixe. */
export function maxPrixFinancable(loan: LoanParams, properties: Property[]): number {
  let lo = 0;
  let hi = 5_000_000;
  for (let i = 0; i < 60; i++) {
    const mid = (lo + hi) / 2;
    const res = computeLoan({ ...loan, prixBien: mid }, properties);
    if (res.margeBancaire >= 0) lo = mid;
    else hi = mid;
  }
  return lo;
}
