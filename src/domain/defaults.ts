// ---------------------------------------------------------------------------
// Valeurs par défaut — reprises de l'Excel d'origine pour servir d'exemple
// concret. L'utilisateur peut tout modifier depuis l'app.
// ---------------------------------------------------------------------------
import type {
  BudgetLine,
  Foyer,
  LoanParams,
  PatrimoineItem,
  Property,
  RavParams,
  SimulationState,
  TaxParams,
} from './types';

export const defaultFoyer: Foyer = {
  personnes: [
    { civilite: 'Autre', prenom: '', contrat: 'CDI' },
    { civilite: 'Autre', prenom: '', contrat: 'CDI' },
  ],
  surfaceM2: 90,
};

export const defaultLoan: LoanParams = {
  prixBien: 350000,
  fraisNotairePct: 0.08,
  apport: 50000,
  tauxNominalAnnuel: 0.034,
  assuranceAnnuellePct: 0.003,
  dureeAnnees: 25,
  tauxEndettementMax: 0.35,
  decoteLoyers: 0.7,
  revenuBancaireA: 2800,
  revenuBancaireB: 2200,
  autresMensualitesCredits: 0,
  methodeCalcul: 'classique',
  ptzActif: false,
  ptzMontant: 100000,
  ptzDureeAnnees: 20,
};

export const defaultTax: TaxParams = {
  tmiIR: 0.3,
  psNue: 0.172,
  psLMNP: 0.186,
  abattementMicroFoncier: 0.3,
  seuilMicroFoncier: 15000,
  abattementMicroBIC: 0.5,
  seuilMicroBIC: 77700,
};

export const defaultRav: RavParams = {
  modeFiscal: 'Séparé',
  nbEnfants: 0,
  parentIsole: false,
  rattachementEnfant: 'A',
  plafondDemiPartEnfant: 1807,
  abattementFraisPro: 0.1,
  autresChargesFixesMensuelles: 0,
  provisionStudioHorsModele: 0,
};

export const defaultProperties: Property[] = [
  {
    id: 'appart1',
    nom: 'Appartement locatif',
    proprietaire: '',
    loyerMensuel: 850,
    chargesRecuperablesMensuelles: 70,
    mensualiteCreditActuel: 600,
    chargesCoproNonRecup: 720,
    taxeFonciere: 1100,
    assurancePNO: 180,
    interetsEmprunt: 2400,
    travaux: 600,
    autresChargesDeductibles: 300,
    cfe: 200,
    comptable: 300,
    amortissementBien: 7000,
    amortissementMeubles: 1500,
    tmi: 0.3,
    regime: 'reelLMNP',
  },
  {
    id: 'studio',
    nom: 'Studio meublé',
    proprietaire: '',
    loyerMensuel: 520,
    chargesRecuperablesMensuelles: 40,
    mensualiteCreditActuel: 380,
    chargesCoproNonRecup: 360,
    taxeFonciere: 600,
    assurancePNO: 110,
    interetsEmprunt: 1500,
    travaux: 300,
    autresChargesDeductibles: 150,
    cfe: 150,
    comptable: 250,
    amortissementBien: 3500,
    amortissementMeubles: 900,
    tmi: 0.3,
    regime: 'reelLMNP',
  },
];

/**
 * Profil servant à estimer un budget de départ réaliste.
 * `nbAdultes` 1 ou 2, `nbEnfants` ≥ 0, `surfaceM2` du logement, `nbBiensLocatifs`.
 */
export interface BudgetProfil {
  nbAdultes: number;
  nbEnfants: number;
  surfaceM2: number;
  nbBiensLocatifs: number;
  /** Logement avec extérieur (jardin/terrasse) → plus d'entretien. */
  hasExterieur?: boolean;
  /** Chauffage tout électrique → facture d'énergie plus élevée. */
  chauffageElectrique?: boolean;
}

export const defaultBudgetProfil: BudgetProfil = {
  nbAdultes: 2,
  nbEnfants: 0,
  surfaceM2: 90,
  nbBiensLocatifs: 2,
  hasExterieur: true,
  chauffageElectrique: false,
};

/**
 * Génère un budget de départ *estimé* à adapter par l'utilisateur.
 * Les dépenses « par personne » sont multipliées par la taille du foyer,
 * les charges du logement (énergie, taxe foncière, entretien) par la surface.
 * Volontairement modeste : ce sont des points de départ, pas des moyennes hautes.
 */
export function computeDefaultBudget(profil: BudgetProfil): BudgetLine[] {
  const a = Math.max(1, Math.round(profil.nbAdultes));
  const e = Math.max(0, Math.round(profil.nbEnfants));
  const s = Math.max(15, Math.round(profil.surfaceM2));
  const b = Math.max(0, Math.round(profil.nbBiensLocatifs));
  const pers = a + e;
  const r = (x: number) => Math.round(x / 5) * 5; // arrondi à 5 €

  let i = 0;
  const line = (
    categorie: BudgetLine['categorie'],
    poste: string,
    montantMensuel: number,
    priorite: string,
    actif = true,
  ): BudgetLine => ({ id: `b${i++}`, categorie, poste, montantMensuel: r(montantMensuel), priorite, actif });

  const energiePerM2 = profil.chauffageElectrique ? 2.6 : 1.9;
  const entretienPerM2 = profil.hasExterieur ? 0.8 : 0.4;

  return [
    // --- Dépenses courantes ---
    line('Dépenses courantes', 'Énergie : électricité / gaz / eau', 45 + energiePerM2 * s, 'Essentiel'),
    line('Dépenses courantes', 'Internet / téléphones', 35 + 12 * a, 'Essentiel'),
    line('Dépenses courantes', 'Assurance habitation / alarme', 12 + 0.18 * s, 'Essentiel'),
    line('Dépenses courantes', 'Taxe foncière (résidence) mensualisée', 0.9 * s, 'Essentiel'),
    line('Dépenses courantes', profil.hasExterieur ? 'Entretien / réparations / extérieur' : 'Entretien / réparations', entretienPerM2 * s, 'Confort'),
    line('Dépenses courantes', 'Courses alimentaires', 200 * a + 120 * e, 'Essentiel'),
    line('Dépenses courantes', 'Restaurants / sorties', 60 * a, 'Confort'),
    line('Dépenses courantes', 'Transports : carburant / recharge', 80 * a, 'Essentiel'),
    line('Dépenses courantes', 'Véhicules : assurances / entretien', 65 * a, 'Essentiel'),
    line('Dépenses courantes', 'Santé / mutuelle / pharmacie', 50 * pers, 'Essentiel'),
    line('Dépenses courantes', 'Sport / loisirs / abonnements', 45 * a + 30 * e, 'Confort'),
    line('Dépenses courantes', 'Vêtements / achats divers', 45 * pers, 'Confort'),
    line('Dépenses courantes', 'Vacances (mensualisé)', 90 * pers, 'Confort'),
    line('Dépenses courantes', 'Budget enfants (garde, école, activités)', 90 * e, 'Essentiel', e > 0),
    // --- Provisions (bailleur) ---
    line('Provisions', 'Provision entretien du logement', 0.5 * s, 'Prudent'),
    line('Provisions', 'Provision risques locatifs (vacance, impayés)', 60 * b, 'Prudent', b > 0),
    line('Provisions', 'Provision travaux copro / appels exceptionnels', 35 * b, 'Prudent', b > 0),
    // --- Épargne ---
    line('Épargne', 'Épargne de sécurité', 150 * a, 'Prudent'),
  ];
}

/** Budget par défaut (profil d'exemple). */
export const defaultBudget: BudgetLine[] = computeDefaultBudget(defaultBudgetProfil);

let _pid = 0;
function p(
  type: PatrimoineItem['type'],
  libelle: string,
  montant: number,
): PatrimoineItem {
  return { id: `p${_pid++}`, type, libelle, montant };
}

export const defaultPatrimoine: PatrimoineItem[] = [
  p('placement', "Plan d'épargne entreprise (PEE)", 12000),
  p('placement', 'PER', 8000),
  p('placement', 'Assurance-vie', 25000),
  p('placement', 'PEA', 18000),
  p('placement', 'Épargne diverse / actions', 10000),
  p('liquidites', 'Livret A', 12000),
  p('liquidites', 'Autres livrets', 5000),
  p('liquidites', 'Comptes courants', 4000),
  p('immobilier', 'Appartement locatif (valorisation)', 220000),
  p('immobilier', 'Studio meublé (valorisation)', 110000),
  p('dette', 'Capital restant dû — appartement', 130000),
  p('dette', 'Capital restant dû — studio', 70000),
];

export function defaultState(): SimulationState {
  return {
    foyer: { personnes: defaultFoyer.personnes.map((x) => ({ ...x })), surfaceM2: defaultFoyer.surfaceM2 },
    loan: { ...defaultLoan },
    properties: defaultProperties.map((x) => ({ ...x })),
    tax: { ...defaultTax },
    rav: { ...defaultRav },
    budget: defaultBudget.map((x) => ({ ...x })),
    patrimoine: defaultPatrimoine.map((x) => ({ ...x })),
  };
}

/**
 * État « vierge » pour un nouveau scénario créé par l'utilisateur : pas de biens
 * ni de patrimoine d'exemple, revenus/prix à zéro. Le budget reste un point de
 * départ estimé (foyer d'1 adulte, 1 logement) que l'onboarding réajuste.
 */
export function blankState(): SimulationState {
  return {
    foyer: { personnes: defaultFoyer.personnes.map((x) => ({ ...x })), surfaceM2: 70 },
    loan: { ...defaultLoan, prixBien: 0, apport: 0, revenuBancaireA: 0, revenuBancaireB: 0 },
    properties: [],
    tax: { ...defaultTax },
    rav: { ...defaultRav },
    budget: computeDefaultBudget({ nbAdultes: 1, nbEnfants: 0, surfaceM2: 70, nbBiensLocatifs: 0 }),
    patrimoine: [],
  };
}
