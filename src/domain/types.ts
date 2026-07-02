// ---------------------------------------------------------------------------
// Domain types — modèle de données de la simulation immobilière.
// Reproduit les "cellules bleues" (entrées) de l'Excel d'origine.
// ---------------------------------------------------------------------------

/** Régime fiscal applicable à une location. */
export type Regime = 'nue' | 'microBIC' | 'reelLMNP';

export const REGIME_LABELS: Record<Regime, string> = {
  nue: 'Location nue',
  microBIC: 'LMNP micro-BIC',
  reelLMNP: 'LMNP réel simplifié',
};

/** Un bien locatif, avec sa vision "banque/trésorerie" et sa vision fiscale. */
export interface Property {
  id: string;
  nom: string;
  proprietaire: string;
  /** Loyer mensuel encaissé (charges récupérables comprises). */
  loyerMensuel: number;
  /** Part de charges récupérables incluses dans le loyer encaissé. */
  chargesRecuperablesMensuelles: number;
  /** Mensualité du crédit actuel sur ce bien (assurance incluse). */
  mensualiteCreditActuel: number;
  // --- Charges & frais annuels (vision fiscale, déductibles au réel) ---
  chargesCoproNonRecup: number; // /an  (G)
  taxeFonciere: number; // /an        (H)
  assurancePNO: number; // /an        (I)
  interetsEmprunt: number; // /an     (J)
  travaux: number; // /an             (K)
  autresChargesDeductibles: number; // /an (L)
  cfe: number; // /an                 (M)
  comptable: number; // /an           (N)
  amortissementBien: number; // /an   (O)
  amortissementMeubles: number; // /an (P)
  /** Tranche marginale d'imposition propre au bien. */
  tmi: number;
  /** Régime fiscal retenu pour ce bien. */
  regime: Regime;
}

/**
 * Méthode de calcul de l'endettement par la banque :
 * - 'classique' : loyers pondérés ajoutés aux revenus, tous les crédits aux charges.
 * - 'differentiel' : par bien, solde (loyer pondéré − mensualité) ajouté aux revenus
 *   s'il est positif, sinon le déficit est ajouté aux charges (crédit du bien non recompté).
 */
export type MethodeCalcul = 'classique' | 'differentiel';

export const METHODE_LABELS: Record<MethodeCalcul, string> = {
  classique: 'Classique',
  differentiel: 'Différentiel',
};

/** Paramètres d'achat et de crédit (onglet Parametres + Synthese). */
export interface LoanParams {
  prixBien: number;
  fraisNotairePct: number;
  apport: number;
  tauxNominalAnnuel: number;
  assuranceAnnuellePct: number; // % du capital total emprunté
  dureeAnnees: number;
  tauxEndettementMax: number; // HCSF 35 %
  decoteLoyers: number; // banque retient X % des loyers
  revenuBancaireA: number; // €/mois, net avant impôt
  revenuBancaireB: number;
  /** Mensualités d'autres crédits en cours (immo non locatif, auto, conso…). */
  autresMensualitesCredits: number;
  /** Méthode de lecture bancaire des loyers et crédits. */
  methodeCalcul: MethodeCalcul;
  // PTZ
  ptzActif: boolean;
  ptzMontant: number;
  ptzDureeAnnees: number;
}

/** Paramètres fiscaux des locations (onglet Hypotheses). */
export interface TaxParams {
  tmiIR: number; // 0.30
  psNue: number; // 0.172
  psLMNP: number; // 0.186
  abattementMicroFoncier: number; // 0.30
  seuilMicroFoncier: number; // 15000
  abattementMicroBIC: number; // 0.50
  seuilMicroBIC: number; // 77700
}

export type ModeFiscal = 'Séparé' | 'Commun';

/** Quelle personne du foyer rattache les enfants (mode séparé). */
export type Rattachement = 'A' | 'B';

/** Civilité d'une personne du foyer. */
export type Civilite = 'M.' | 'Mme' | 'Autre';

export const CIVILITE_LABELS: Record<Civilite, string> = {
  'M.': 'Monsieur',
  Mme: 'Madame',
  Autre: 'Non précisé',
};

/** Type de contrat / statut professionnel — influe sur la lecture banque. */
export type TypeContrat =
  | 'CDI'
  | 'CDD'
  | 'Intérim'
  | 'Indépendant'
  | 'Fonctionnaire'
  | 'Dirigeant'
  | 'Retraité'
  | 'Sans emploi';

export const CONTRAT_LABELS: Record<TypeContrat, string> = {
  CDI: 'CDI',
  CDD: 'CDD',
  Intérim: 'Intérim',
  Indépendant: 'Indépendant / freelance',
  Fonctionnaire: 'Fonctionnaire',
  Dirigeant: "Chef d'entreprise",
  Retraité: 'Retraité',
  'Sans emploi': 'Sans emploi',
};

/**
 * Un revenu issu de ce contrat est-il considéré « stable » par une banque
 * (compté à 100 % dans la capacité d'emprunt) ? Les autres sont souvent
 * décotés ou exigent plusieurs bilans.
 */
export function contratStable(c: TypeContrat): boolean {
  return c === 'CDI' || c === 'Fonctionnaire' || c === 'Retraité';
}

/** Une personne du foyer. */
export interface Personne {
  civilite: Civilite;
  prenom: string; // libre, peut être vide
  contrat: TypeContrat;
}

/** Composition du foyer (1 ou 2 personnes ; index 0 = A, index 1 = B). */
export interface Foyer {
  personnes: Personne[];
  /** Surface habitable du logement principal, en m² (sert aux estimations de budget). */
  surfaceM2: number;
}

/** Libellé d'affichage d'une personne du foyer (prénom sinon repère générique). */
export function nomPersonne(foyer: Foyer, index: number): string {
  const prenom = foyer.personnes[index]?.prenom?.trim();
  if (prenom) return prenom;
  return index === 0 ? 'Vous' : 'Conjoint·e';
}

/** Paramètres du reste à vivre / impôt sur le revenu (onglet RAV). */
export interface RavParams {
  modeFiscal: ModeFiscal;
  nbEnfants: number; // nombre d'enfants à charge
  parentIsole: boolean; // case T : parent isolé (mode séparé avec enfants)
  rattachementEnfant: Rattachement; // personne qui rattache les enfants (mode séparé)
  plafondDemiPartEnfant: number; // €/an (1807)
  abattementFraisPro: number; // 0.10
  autresChargesFixesMensuelles: number;
  provisionStudioHorsModele: number;
}

/** Nombre de demi-parts apportées par les enfants (règle française). */
export function partsEnfants(nbEnfants: number): number {
  // 0,5 part pour chacun des 2 premiers, 1 part par enfant à partir du 3e.
  const n = Math.max(0, Math.floor(nbEnfants));
  return Math.min(n, 2) * 0.5 + Math.max(0, n - 2) * 1;
}

/** Une ligne du budget courant (onglet "Budget courant / RAV réel"). */
export type BudgetCategorie = 'Dépenses courantes' | 'Provisions' | 'Épargne';

export interface BudgetLine {
  id: string;
  categorie: BudgetCategorie;
  poste: string;
  montantMensuel: number;
  priorite: string;
  actif: boolean;
}

/** Un actif ou une dette du patrimoine (onglet Patrimoine). */
export type PatrimoineType = 'liquidites' | 'placement' | 'immobilier' | 'dette';

export interface PatrimoineItem {
  id: string;
  type: PatrimoineType;
  libelle: string;
  /** Montant positif. Pour 'immobilier' c'est la valorisation ; la dette
   *  associée est saisie comme un item 'dette'. */
  montant: number;
}

/** L'état complet, sérialisable et persisté. */
export interface SimulationState {
  foyer: Foyer;
  loan: LoanParams;
  properties: Property[];
  tax: TaxParams;
  rav: RavParams;
  budget: BudgetLine[];
  patrimoine: PatrimoineItem[];
}
