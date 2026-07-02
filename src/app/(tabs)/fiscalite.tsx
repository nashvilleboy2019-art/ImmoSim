import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  BigStat,
  Button,
  Card,
  Divider,
  NumberField,
  PercentField,
  Row,
  Screen,
  SectionTitle,
  Segmented,
  Subtitle,
  TextField,
} from '@/components/ui';
import { REGIME_LABELS, type Property, type Regime } from '@/domain';
import { computeRegimes } from '@/domain/rentalTax';
import { useComputed } from '@/store/useComputed';
import { useLoan, useProperties, useRav, useStore, useTax } from '@/store/useStore';
import { formatEUR, radius, spacing, usePalette } from '@/theme';

const REGIME_OPTIONS: { value: Regime; label: string }[] = [
  { value: 'nue', label: 'Nu' },
  { value: 'microBIC', label: 'micro-BIC' },
  { value: 'reelLMNP', label: 'LMNP réel' },
];

const REGIME_INFO: Record<Regime, { titre: string; texte: string }> = {
  nue: {
    titre: 'Location nue — revenus fonciers',
    texte:
      'Loyers déclarés en revenus fonciers. Sous 15 000 €/an : abattement forfaitaire de 30 % (micro-foncier) ; au-delà : déduction des charges réelles. Pas d’amortissement. ➜ Simple, intéressant si peu de charges et logement non meublé.',
  },
  microBIC: {
    titre: 'LMNP meublé — micro-BIC',
    texte:
      'Abattement forfaitaire de 50 % sur les loyers, sans justificatif. Les charges réelles ne réduisent pas l’impôt (mais restent décaissées). ➜ Le plus simple ; avantageux quand vos charges réelles font moins de 50 % des loyers.',
  },
  reelLMNP: {
    titre: 'LMNP meublé — réel',
    texte:
      'Déduction de toutes les charges réelles ET de l’amortissement du bien et des meubles. La base imposable est souvent ramenée à 0 pendant des années. ➜ Le plus avantageux dès que charges + amortissements sont élevés ; nécessite un comptable.',
  },
};

function RegimeExplainer({ regime }: { regime: Regime }) {
  const p = usePalette();
  const info = REGIME_INFO[regime];
  return (
    <View style={[styles.explain, { backgroundColor: p.accentSoft }]}>
      <Text style={{ color: p.text, fontWeight: '800', fontSize: 13, marginBottom: 2 }}>{info.titre}</Text>
      <Text style={{ color: p.textSecondary, fontSize: 12.5, lineHeight: 17 }}>{info.texte}</Text>
    </View>
  );
}

function PropertyCard({ property }: { property: Property }) {
  const p = usePalette();
  const tax = useTax();
  const update = useStore((s) => s.updateProperty);
  const remove = useStore((s) => s.removeProperty);
  const [open, setOpen] = useState(false);

  const regimes = computeRegimes(property, tax);
  const retenu = regimes[property.regime];
  const set = (patch: Partial<Property>) => update(property.id, patch);

  // Meilleur régime (cash net mensuel le plus élevé) parmi les loués.
  const best = (['reelLMNP', 'microBIC', 'nue'] as Regime[]).reduce((a, b) =>
    regimes[b].cashNetMensuel > regimes[a].cashNetMensuel ? b : a,
  );

  // Champs pertinents selon le régime retenu.
  const reg = property.regime;
  const showCfe = reg !== 'nue';
  const showComptable = reg === 'reelLMNP';
  const showAmort = reg === 'reelLMNP';

  return (
    <Card>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: p.text, fontSize: 17, fontWeight: '800' }}>{property.nom}</Text>
          {property.proprietaire ? (
            <Text style={{ color: p.textMuted, fontSize: 13 }}>{property.proprietaire}</Text>
          ) : null}
        </View>
        <BigStat
          label="Cash net / mois"
          value={formatEUR(retenu.cashNetMensuel)}
          tone={retenu.cashNetMensuel >= 0 ? 'positive' : 'negative'}
        />
      </View>

      <Segmented options={REGIME_OPTIONS} value={property.regime} onChange={(regime) => set({ regime })} />
      <RegimeExplainer regime={property.regime} />

      {property.loyerMensuel > 0 && best !== property.regime ? (
        <Pressable onPress={() => set({ regime: best })}>
          <Badge text={`💡 ${REGIME_LABELS[best]} rapporte +${formatEUR(regimes[best].cashNetMensuel - retenu.cashNetMensuel)}/m`} tone="warning" />
        </Pressable>
      ) : null}

      <View style={{ gap: spacing.xs }}>
        <Row label="Base imposable / an" value={formatEUR(retenu.baseImposable)} />
        <Row label="Impôts + prélèvements sociaux / an" value={formatEUR(retenu.impotsTotal)} tone={retenu.impotsTotal > 0 ? 'negative' : 'default'} />
        <Text style={{ color: p.textMuted, fontSize: 12 }}>{retenu.note}</Text>
      </View>

      <Pressable onPress={() => setOpen((o) => !o)} style={{ paddingVertical: spacing.xs }}>
        <Text style={{ color: p.accent, fontWeight: '700' }}>
          {open ? '▾ Masquer le détail' : '▸ Modifier loyers, charges & amortissements'}
        </Text>
      </Pressable>

      {open ? (
        <View style={{ gap: spacing.md }}>
          <Divider />
          {/* Comparatif des 3 régimes */}
          <View style={[styles.compare, { backgroundColor: p.inputBg }]}>
            {REGIME_OPTIONS.map((o) => {
              const rr = regimes[o.value];
              const active = o.value === property.regime;
              return (
                <View key={o.value} style={{ flex: 1, alignItems: 'center', gap: 2 }}>
                  <Text style={{ color: p.textMuted, fontSize: 11, fontWeight: '600' }}>{o.label}</Text>
                  <Text style={{ color: active ? p.accent : p.text, fontWeight: active ? '800' : '600', fontSize: 13 }}>
                    {formatEUR(rr.cashNetMensuel)}
                  </Text>
                </View>
              );
            })}
          </View>

          <SectionTitle>Identité & loyers</SectionTitle>
          <TextField label="Nom du bien" value={property.nom} onChange={(nom) => set({ nom })} />
          <TextField label="Propriétaire" value={property.proprietaire} onChange={(proprietaire) => set({ proprietaire })} />
          <NumberField label="Loyer mensuel encaissé" value={property.loyerMensuel} onChange={(loyerMensuel) => set({ loyerMensuel })} suffix="€" />
          <NumberField
            label="Dont charges récupérables / mois"
            value={property.chargesRecuperablesMensuelles}
            onChange={(chargesRecuperablesMensuelles) => set({ chargesRecuperablesMensuelles })}
            suffix="€"
            hint="Refacturées au locataire, exclues du loyer fiscal"
          />
          <NumberField
            label="Mensualité crédit actuel"
            value={property.mensualiteCreditActuel}
            onChange={(mensualiteCreditActuel) => set({ mensualiteCreditActuel })}
            suffix="€/mois"
            hint="Utilisée pour la capacité d'emprunt et le reste à vivre"
          />

          <SectionTitle>Charges & frais déductibles (par an)</SectionTitle>
          {reg === 'microBIC' ? (
            <Text style={{ color: p.textMuted, fontSize: 12, lineHeight: 16 }}>
              En micro-BIC ces charges ne réduisent pas l'impôt (abattement 50 %), mais elles sont
              bien retirées de votre cash net.
            </Text>
          ) : null}
          <NumberField label="Charges copro non récupérables" value={property.chargesCoproNonRecup} onChange={(v) => set({ chargesCoproNonRecup: v })} suffix="€/an" />
          <NumberField label="Taxe foncière" value={property.taxeFonciere} onChange={(v) => set({ taxeFonciere: v })} suffix="€/an" />
          <NumberField label="Assurance PNO" value={property.assurancePNO} onChange={(v) => set({ assurancePNO: v })} suffix="€/an" />
          <NumberField label="Intérêts d'emprunt" value={property.interetsEmprunt} onChange={(v) => set({ interetsEmprunt: v })} suffix="€/an" />
          <NumberField label="Travaux d'entretien" value={property.travaux} onChange={(v) => set({ travaux: v })} suffix="€/an" />
          <NumberField label="Autres charges déductibles" value={property.autresChargesDeductibles} onChange={(v) => set({ autresChargesDeductibles: v })} suffix="€/an" />
          {showCfe ? (
            <NumberField label="CFE" value={property.cfe} onChange={(v) => set({ cfe: v })} suffix="€/an" hint="Cotisation foncière des entreprises (meublé)" />
          ) : null}
          {showComptable ? (
            <NumberField label="Comptable LMNP" value={property.comptable} onChange={(v) => set({ comptable: v })} suffix="€/an" />
          ) : null}

          {showAmort ? (
            <>
              <SectionTitle>Amortissements LMNP réel (par an)</SectionTitle>
              <NumberField label="Amortissement du bien" value={property.amortissementBien} onChange={(v) => set({ amortissementBien: v })} suffix="€/an" hint="Hors terrain, non amortissable" />
              <NumberField label="Amortissement meubles" value={property.amortissementMeubles} onChange={(v) => set({ amortissementMeubles: v })} suffix="€/an" />
            </>
          ) : null}

          <PercentField label="Tranche marginale d'imposition (TMI)" value={property.tmi} onChange={(v) => set({ tmi: v })} />

          <Button title="Supprimer ce bien" tone="negative" variant="ghost" onPress={() => remove(property.id)} />
        </View>
      ) : null}
    </Card>
  );
}

function LocationView() {
  const p = usePalette();
  const properties = useProperties();
  const addProperty = useStore((s) => s.addProperty);
  const c = useComputed();
  const r = c.rental;

  return (
    <>
      <Card>
        <SectionTitle>Synthèse des locations</SectionTitle>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
          <BigStat label="Cash net / mois" value={formatEUR(r.cashNetMensuel)} tone="positive" />
          <BigStat label="Impôts + PS / an" value={formatEUR(r.impotsTotal)} tone={r.impotsTotal > 0 ? 'negative' : 'default'} />
        </View>
        <Divider />
        <Row label="Encaissement brut annuel" value={formatEUR(r.encaissementBrutAnnuel)} />
        <Row label="Recettes fiscales HC / an" value={formatEUR(r.recettesHC)} />
        <Row label="Base imposable totale / an" value={formatEUR(r.baseImposable)} />
        <Divider />
        <Text style={{ color: p.textMuted, fontSize: 12, fontWeight: '600' }}>
          Si TOUS les biens étaient au même régime (cash net / mois) :
        </Text>
        <Row label="Tout en location nue" value={formatEUR(r.totalNueMensuel)} />
        <Row label="Tout en micro-BIC" value={formatEUR(r.totalMicroBICMensuel)} />
        <Row label="Tout en LMNP réel" value={formatEUR(r.totalReelMensuel)} />
        <Subtitle>
          La synthèse utilise le régime choisi pour chaque bien. Estimation marginale (TMI + prélèvements sociaux), pas une déclaration fiscale.
        </Subtitle>
      </Card>

      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}

      <Pressable
        onPress={addProperty}
        style={({ pressed }) => [styles.addBtn, { borderColor: p.accent, opacity: pressed ? 0.6 : 1 }]}>
        <Text style={{ color: p.accent, fontWeight: '700' }}>＋ Ajouter un bien locatif</Text>
      </Pressable>
    </>
  );
}

function ImpotView({ hasRental }: { hasRental: boolean }) {
  const p = usePalette();
  const router = useRouter();
  const rav = useRav();
  const loan = useLoan();
  const addProperty = useStore((s) => s.addProperty);
  const c = useComputed();
  const r = c.rav;
  const showConjoint = rav.modeFiscal === 'Commun' || loan.revenuBancaireB > 0;

  return (
    <>
      <Card>
        <SectionTitle>Impôt sur le revenu — salaires du foyer</SectionTitle>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
          <BigStat label="IR estimé / mois" value={formatEUR(r.irSalaireMensuel)} tone="negative" />
          <BigStat label="Net après IR / mois" value={formatEUR(r.netSalaireMensuel)} tone="positive" />
        </View>
        <Divider />
        <Row label="Imposition" value={rav.modeFiscal === 'Commun' ? 'Commune (marié·e / PACS)' : 'Séparée'} />
        <Row label="Enfants à charge" value={`${rav.nbEnfants}`} />
        {r.salaires
          .filter((s, i) => i === 0 || showConjoint)
          .map((s) => (
            <Row
              key={s.nom}
              label={`${s.nom} — net après IR`}
              value={formatEUR(s.netMensuel)}
              hint={`IR ${formatEUR(s.irMensuel)}/mois · ${s.parts} part(s)`}
            />
          ))}
        <Button title="✎ Ajuster mes revenus et ma situation" variant="ghost" onPress={() => router.push('/reste-a-vivre')} />
      </Card>

      <Card>
        <SectionTitle>Comment c'est calculé</SectionTitle>
        <Subtitle>
          L'impôt est estimé avec le barème progressif indicatif 2026 (tranches 0 / 11 / 30 / 41 / 45 %),
          appliqué au revenu imposable = salaires nets − 10 % de frais professionnels. Le quotient
          familial divise ce revenu par le nombre de parts (1 par adulte, 0,5 par enfant pour les deux
          premiers, 1 ensuite), ce qui réduit l'impôt — l'avantage par enfant étant plafonné.
        </Subtitle>
      </Card>

      {!hasRental ? (
        <Card>
          <SectionTitle>Fiscalité des locations</SectionTitle>
          <Subtitle>
            Aucune location dans ce scénario. Ajoutez un bien locatif pour comparer les régimes (nu,
            micro-BIC, LMNP réel) et estimer son cash net.
          </Subtitle>
          <Button title="＋ Ajouter un bien locatif" onPress={addProperty} />
        </Card>
      ) : null}
    </>
  );
}

export default function FiscaliteScreen() {
  const properties = useProperties();
  const hasRental = properties.length > 0;
  const [viewState, setViewState] = useState<'location' | 'impot'>('location');
  const view = hasRental ? viewState : 'impot';

  return (
    <Screen>
      {hasRental ? (
        <Segmented<'location' | 'impot'>
          options={[
            { value: 'location', label: 'Location' },
            { value: 'impot', label: 'Impôt sur le revenu' },
          ]}
          value={view}
          onChange={setViewState}
        />
      ) : null}

      {view === 'location' ? <LocationView /> : <ImpotView hasRental={hasRental} />}
    </Screen>
  );
}

const styles = StyleSheet.create({
  compare: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  explain: {
    borderRadius: radius.md,
    padding: spacing.md,
  },
  addBtn: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
  },
});
