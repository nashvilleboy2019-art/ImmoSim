// ---------------------------------------------------------------------------
// Fiscalité des locations — reproduit les onglets "Hypotheses", "Detail" et
// "Synthese locations". Pour chaque bien, les 3 régimes sont calculés, puis le
// régime retenu (Property.regime) est sélectionné.
// ---------------------------------------------------------------------------
import type { Property, Regime, TaxParams } from './types';

/** Vision intermédiaire annuelle d'un bien (colonnes F..S de Hypotheses). */
function fiscalAnnuel(p: Property) {
  const loyerFiscalMensuelHC = p.loyerMensuel - p.chargesRecuperablesMensuelles;
  const recettesFiscalesHC = loyerFiscalMensuelHC * 12; // F
  // Q : total charges LMNP réel hors amortissements = SUM(G:N)
  const totalChargesReelHorsAmort =
    p.chargesCoproNonRecup +
    p.taxeFonciere +
    p.assurancePNO +
    p.interetsEmprunt +
    p.travaux +
    p.autresChargesDeductibles +
    p.cfe +
    p.comptable;
  // R : total amortissements = O + P
  const totalAmortissements = p.amortissementBien + p.amortissementMeubles;
  // S : charges déductibles location nue réel = SUM(G:L)  (hors CFE et comptable)
  const chargesNueReel =
    p.chargesCoproNonRecup +
    p.taxeFonciere +
    p.assurancePNO +
    p.interetsEmprunt +
    p.travaux +
    p.autresChargesDeductibles;
  return {
    recettesFiscalesHC,
    totalChargesReelHorsAmort,
    totalAmortissements,
    chargesNueReel,
  };
}

/** Résultat d'un bien sous un régime donné (une ligne de l'onglet Detail). */
export interface RegimeResult {
  regime: Regime;
  recettesHC: number; // C
  chargesCash: number; // D — charges réellement décaissées
  amortissements: number; // E
  baseImposable: number; // F
  ir: number; // G
  ps: number; // H
  impotsTotal: number; // I = G + H
  cashNetAnnuel: number; // J = recettes - chargesCash - impôts
  cashNetMensuel: number; // K
  note: string;
}

/** Calcule un bien sous les 3 régimes (lignes Detail correspondantes). */
export function computeRegimes(p: Property, tax: TaxParams): Record<Regime, RegimeResult> {
  const a = fiscalAnnuel(p);
  const C = a.recettesFiscalesHC;
  const loue = C > 0;

  // ---- Location nue ----
  const nueCharges = a.chargesNueReel; // S
  const nueBase = !loue
    ? 0
    : C <= tax.seuilMicroFoncier
      ? C * (1 - tax.abattementMicroFoncier)
      : Math.max(0, C - nueCharges);
  const nueIR = nueBase * p.tmi;
  const nuePS = nueBase * tax.psNue;
  const nueImpots = nueIR + nuePS;
  const nueCashAnnuel = loue ? C - nueCharges - nueImpots : 0;
  const nue: RegimeResult = {
    regime: 'nue',
    recettesHC: C,
    chargesCash: nueCharges,
    amortissements: 0,
    baseImposable: nueBase,
    ir: nueIR,
    ps: nuePS,
    impotsTotal: nueImpots,
    cashNetAnnuel: nueCashAnnuel,
    cashNetMensuel: nueCashAnnuel / 12,
    note: !loue
      ? 'Non loué'
      : C <= tax.seuilMicroFoncier
        ? 'Micro-foncier 30 % possible sur ce bien'
        : 'Réel foncier',
  };

  // ---- LMNP micro-BIC ----
  const bicCharges = a.totalChargesReelHorsAmort - p.comptable; // Q - N
  const bicBase = !loue
    ? 0
    : C <= tax.seuilMicroBIC
      ? C * (1 - tax.abattementMicroBIC)
      : Math.max(0, C - bicCharges);
  const bicIR = bicBase * p.tmi;
  const bicPS = bicBase * tax.psLMNP;
  const bicImpots = bicIR + bicPS;
  const bicCashAnnuel = loue ? C - bicCharges - bicImpots : 0;
  const microBIC: RegimeResult = {
    regime: 'microBIC',
    recettesHC: C,
    chargesCash: bicCharges,
    amortissements: 0,
    baseImposable: bicBase,
    ir: bicIR,
    ps: bicPS,
    impotsTotal: bicImpots,
    cashNetAnnuel: bicCashAnnuel,
    cashNetMensuel: bicCashAnnuel / 12,
    note: !loue
      ? 'Non loué'
      : C <= tax.seuilMicroBIC
        ? 'Micro-BIC 50 % : charges cash retirées du net mais non déduites fiscalement'
        : 'Seuil micro-BIC dépassé',
  };

  // ---- LMNP réel simplifié ----
  const reelCharges = a.totalChargesReelHorsAmort; // Q
  const reelAmort = a.totalAmortissements; // R
  const reelBase = !loue ? 0 : Math.max(0, C - reelCharges - reelAmort);
  const reelIR = reelBase * p.tmi;
  const reelPS = reelBase * tax.psLMNP;
  const reelImpots = reelIR + reelPS;
  // Amortissement non décaissé : cash net = recettes - charges cash - impôts.
  const reelCashAnnuel = loue ? C - reelCharges - reelImpots : 0;
  const reelLMNP: RegimeResult = {
    regime: 'reelLMNP',
    recettesHC: C,
    chargesCash: reelCharges,
    amortissements: reelAmort,
    baseImposable: reelBase,
    ir: reelIR,
    ps: reelPS,
    impotsTotal: reelImpots,
    cashNetAnnuel: reelCashAnnuel,
    cashNetMensuel: reelCashAnnuel / 12,
    note: !loue
      ? 'Non loué'
      : reelBase === 0
        ? 'Charges + amortissements : base imposable neutralisée'
        : 'Charges + amortissements',
  };

  return { nue, microBIC, reelLMNP };
}

export interface PropertyTaxResult {
  property: Property;
  regimes: Record<Regime, RegimeResult>;
  retenu: RegimeResult;
}

export interface RentalTaxResult {
  parBien: PropertyTaxResult[];
  // Totaux "Sélection par bien" (régime retenu de chaque bien).
  recettesHC: number;
  baseImposable: number;
  chargesCash: number;
  amortissements: number;
  ir: number;
  ps: number;
  impotsTotal: number;
  cashNetAnnuel: number;
  cashNetMensuel: number;
  // Totaux comparatifs si TOUS les biens étaient au même régime.
  totalNueMensuel: number;
  totalMicroBICMensuel: number;
  totalReelMensuel: number;
  encaissementBrutAnnuel: number;
  interetsApparts: number; // somme des intérêts d'emprunt /an
}

export function computeRentalTax(properties: Property[], tax: TaxParams): RentalTaxResult {
  const parBien: PropertyTaxResult[] = properties.map((p) => {
    const regimes = computeRegimes(p, tax);
    return { property: p, regimes, retenu: regimes[p.regime] };
  });

  const sum = (sel: (r: RegimeResult) => number) =>
    parBien.reduce((s, b) => s + sel(b.retenu), 0);

  return {
    parBien,
    recettesHC: sum((r) => r.recettesHC),
    baseImposable: sum((r) => r.baseImposable),
    chargesCash: sum((r) => r.chargesCash),
    amortissements: sum((r) => r.amortissements),
    ir: sum((r) => r.ir),
    ps: sum((r) => r.ps),
    impotsTotal: sum((r) => r.impotsTotal),
    cashNetAnnuel: sum((r) => r.cashNetAnnuel),
    cashNetMensuel: sum((r) => r.cashNetMensuel),
    totalNueMensuel: parBien.reduce((s, b) => s + b.regimes.nue.cashNetMensuel, 0),
    totalMicroBICMensuel: parBien.reduce(
      (s, b) => s + b.regimes.microBIC.cashNetMensuel,
      0,
    ),
    totalReelMensuel: parBien.reduce((s, b) => s + b.regimes.reelLMNP.cashNetMensuel, 0),
    encaissementBrutAnnuel: properties.reduce((s, p) => s + p.loyerMensuel * 12, 0),
    interetsApparts: properties.reduce((s, p) => s + p.interetsEmprunt, 0),
  };
}
