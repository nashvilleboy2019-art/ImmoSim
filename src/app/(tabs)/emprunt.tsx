import { View } from 'react-native';

import {
  Badge,
  BigStat,
  Card,
  Divider,
  NumberField,
  PercentField,
  Row,
  Screen,
  SectionTitle,
  Segmented,
  Subtitle,
  ToggleField,
} from '@/components/ui';
import { METHODE_LABELS, type MethodeCalcul } from '@/domain';
import { useComputed } from '@/store/useComputed';
import { useLoan, useRav, useStore } from '@/store/useStore';
import { formatEUR, formatPct, spacing, usePalette } from '@/theme';

const STATUT_UI = {
  ok: { color: 'positive', badge: 'OK', tone: 'positive' },
  derogation: { color: 'warning', badge: 'Dérogation', tone: 'warning' },
  alerte: { color: 'negative', badge: 'Alerte', tone: 'negative' },
} as const;

export default function EmpruntScreen() {
  const p = usePalette();
  const loan = useLoan();
  const rav = useRav();
  const setLoan = useStore((s) => s.setLoan);
  const c = useComputed();
  const r = c.loan;
  const showConjoint = rav.modeFiscal === 'Commun' || loan.revenuBancaireB > 0;
  const overEffort = r.tauxEffortGlobal > loan.tauxEndettementMax;
  const differentiel = r.methode === 'differentiel';
  const st = STATUT_UI[r.statut];
  const verdictColor = st.color === 'positive' ? p.positive : st.color === 'warning' ? p.warning : p.negative;

  return (
    <Screen>
      {/* Verdict */}
      <Card style={{ borderColor: verdictColor }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <BigStat
            label="Marge bancaire mensuelle"
            value={formatEUR(r.margeBancaire)}
            tone={r.margeBancaire >= 0 ? 'positive' : 'negative'}
            caption={`Capacité restante ${formatEUR(r.capaciteRestante)} · Mensualité ${formatEUR(r.mensualiteMaison)}`}
          />
          <Badge text={st.badge} tone={st.tone} />
        </View>
        <Divider />
        <Row label="Prix max finançable (apport constant)" value={formatEUR(c.maxPrix)} tone="accent" strong />
        <Subtitle>
          {r.statut === 'ok'
            ? 'La mensualité tient dans votre capacité (≤ 35 %). Profil dans les normes HCSF.'
            : r.statut === 'derogation'
              ? `Vous êtes entre ${formatPct(loan.tauxEndettementMax, 0)} et ${formatPct(loan.tauxEndettementMax + 0.05, 0)}. Dépassement possible via la marge de flexibilité des banques (20 % de leur production, priorité résidence principale / primo-accédants), mais non garanti.`
              : 'La mensualité dépasse nettement votre capacité. Baissez le prix, augmentez l’apport ou la durée.'}
        </Subtitle>
      </Card>

      {/* Entrées achat */}
      <Card>
        <SectionTitle>Achat & crédit</SectionTitle>
        <NumberField label="Prix du bien" value={loan.prixBien} onChange={(v) => setLoan({ prixBien: v })} suffix="€" />
        <PercentField
          label="Frais de notaire"
          value={loan.fraisNotairePct}
          onChange={(v) => setLoan({ fraisNotairePct: v })}
          hint="Ancien ~7-8 %, neuf ~2,5-3,5 %"
        />
        <NumberField label="Apport" value={loan.apport} onChange={(v) => setLoan({ apport: v })} suffix="€" />
        <PercentField
          label="Taux nominal annuel"
          value={loan.tauxNominalAnnuel}
          onChange={(v) => setLoan({ tauxNominalAnnuel: v })}
        />
        <PercentField
          label="Assurance annuelle"
          value={loan.assuranceAnnuellePct}
          onChange={(v) => setLoan({ assuranceAnnuellePct: v })}
          hint="% du capital emprunté"
        />
        <NumberField
          label="Durée du prêt"
          value={loan.dureeAnnees}
          onChange={(v) => setLoan({ dureeAnnees: v })}
          suffix="ans"
        />
      </Card>

      {/* PTZ */}
      <Card>
        <SectionTitle>Prêt à taux zéro (hypothèse)</SectionTitle>
        <ToggleField
          label="Activer le PTZ"
          value={loan.ptzActif}
          onChange={(v) => setLoan({ ptzActif: v })}
          hint="À confirmer avec la banque selon éligibilité"
        />
        {loan.ptzActif ? (
          <>
            <NumberField label="Montant du PTZ" value={loan.ptzMontant} onChange={(v) => setLoan({ ptzMontant: v })} suffix="€" />
            <NumberField
              label="Durée de remboursement PTZ"
              value={loan.ptzDureeAnnees}
              onChange={(v) => setLoan({ ptzDureeAnnees: v })}
              suffix="ans"
            />
            <Row label="Gain mensuel grâce au PTZ" value={formatEUR(r.gainMensuelPtz)} tone="positive" />
          </>
        ) : null}
      </Card>

      {/* Revenus & règles banque */}
      <Card>
        <SectionTitle>Revenus & règles banque</SectionTitle>
        <NumberField
          label="Mon salaire net mensuel (avant IR)"
          value={loan.revenuBancaireA}
          onChange={(v) => setLoan({ revenuBancaireA: v })}
          suffix="€/mois"
          hint="Net versé sur le compte, avant impôt sur le revenu"
        />
        {showConjoint ? (
          <NumberField
            label="Salaire net du co-emprunteur (avant IR)"
            value={loan.revenuBancaireB}
            onChange={(v) => setLoan({ revenuBancaireB: v })}
            suffix="€/mois"
          />
        ) : null}
        <NumberField
          label="Autres crédits en cours"
          value={loan.autresMensualitesCredits}
          onChange={(v) => setLoan({ autresMensualitesCredits: v })}
          suffix="€/mois"
          hint="Immo non locatif, auto, conso… réduit votre capacité"
        />
        <PercentField
          label="Taux d'endettement max"
          value={loan.tauxEndettementMax}
          onChange={(v) => setLoan({ tauxEndettementMax: v })}
          hint="Référence HCSF 35 %"
        />
        <PercentField
          label="Décote des loyers retenus"
          value={loan.decoteLoyers}
          onChange={(v) => setLoan({ decoteLoyers: v })}
          hint="La banque ne retient qu'une partie des loyers"
        />
        <SectionTitle>Méthode de calcul de la banque</SectionTitle>
        <Segmented<MethodeCalcul>
          options={[
            { value: 'classique', label: METHODE_LABELS.classique },
            { value: 'differentiel', label: METHODE_LABELS.differentiel },
          ]}
          value={r.methode}
          onChange={(methodeCalcul) => setLoan({ methodeCalcul })}
        />
        <Subtitle>
          {differentiel
            ? 'Différentiel : pour chaque bien loué, on fait loyer pondéré − mensualité ; l’excédent gonfle vos revenus, le déficit s’ajoute aux charges. Souvent plus favorable aux investisseurs.'
            : 'Classique : les loyers pondérés s’ajoutent à vos revenus et toutes les mensualités de crédit à vos charges.'}
        </Subtitle>
        <Subtitle>
          Les loyers et crédits des biens locatifs se modifient dans l'onglet « Fiscalité ».
        </Subtitle>
      </Card>

      {/* Détail du plan de financement */}
      <Card>
        <SectionTitle>Plan de financement</SectionTitle>
        <Row label="Prix du bien" value={formatEUR(loan.prixBien)} />
        <Row label="Frais de notaire" value={formatEUR(r.fraisNotaire)} />
        <Row label="Coût total de l'opération" value={formatEUR(r.coutTotal)} strong />
        <Row label="− Apport" value={formatEUR(-loan.apport)} tone="positive" />
        <Row label="Besoin de financement" value={formatEUR(r.besoinFinancement)} />
        {r.ptzRetenu > 0 ? <Row label="PTZ retenu" value={formatEUR(r.ptzRetenu)} /> : null}
        {r.ptzRetenu > 0 ? <Row label="Prêt classique" value={formatEUR(r.pretClassique)} hint="Part financée hors PTZ" /> : null}
        <Divider />
        <Row label="Mensualité prêt principal" value={formatEUR(r.mensualiteClassique)} />
        {r.mensualitePtz > 0 ? <Row label="Mensualité PTZ" value={formatEUR(r.mensualitePtz)} /> : null}
        <Row label="Assurance mensuelle" value={formatEUR(r.assuranceMensuelle)} />
        <Row label="Mensualité maison totale" value={formatEUR(r.mensualiteMaison)} strong hint="Ce que vous rembourserez chaque mois pour ce bien" />
      </Card>

      {/* Capacité */}
      <Card>
        <SectionTitle>Capacité d'endettement · méthode {METHODE_LABELS[r.methode].toLowerCase()}</SectionTitle>
        <Row label="Salaires nets du foyer" value={formatEUR(r.revenusBancairesCouple)} />
        {differentiel ? (
          <>
            {r.revenusLocatifsNets > 0 ? <Row label="+ Revenu locatif net (biens excédentaires)" value={formatEUR(r.revenusLocatifsNets)} tone="positive" /> : null}
            <Row label="Revenus retenus" value={formatEUR(r.revenusRetenus)} />
            <Row label={`Capacité brute (${formatPct(loan.tauxEndettementMax, 0)})`} value={formatEUR(r.capaciteBrute35)} />
            {r.chargesLocativesNettes > 0 ? <Row label="− Déficit des biens loués" value={formatEUR(-r.chargesLocativesNettes)} tone="negative" /> : null}
          </>
        ) : (
          <>
            {r.loyersRetenusBanque > 0 ? <Row label="+ Loyers retenus (×décote)" value={formatEUR(r.loyersRetenusBanque)} tone="positive" /> : null}
            <Row label="Revenus retenus" value={formatEUR(r.revenusRetenus)} />
            <Row label={`Capacité brute (${formatPct(loan.tauxEndettementMax, 0)})`} value={formatEUR(r.capaciteBrute35)} />
            {r.mensualitesAppartsExistants > 0 ? <Row label="− Mensualités biens loués" value={formatEUR(-r.mensualitesAppartsExistants)} tone="negative" /> : null}
          </>
        )}
        {r.autresMensualitesCredits > 0 ? <Row label="− Autres crédits en cours" value={formatEUR(-r.autresMensualitesCredits)} tone="negative" /> : null}
        <Divider />
        <Row
          label="Capacité restante pour ce bien"
          value={formatEUR(r.capaciteRestante)}
          strong
          tone="accent"
          hint="Mensualité maximale que la banque vous laisse pour ce nouvel achat"
        />
        <Row
          label="Taux d'effort global estimé"
          value={formatPct(r.tauxEffortGlobal)}
          tone={overEffort ? 'negative' : 'default'}
          strong={overEffort}
          hint={overEffort ? `Au-dessus du seuil de ${formatPct(loan.tauxEndettementMax, 0)} : risque de refus` : undefined}
        />
      </Card>

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}
