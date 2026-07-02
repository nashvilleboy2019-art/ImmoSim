import { useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Badge,
  BigStat,
  Button,
  Card,
  ChipSelect,
  Divider,
  NumberField,
  Row,
  Screen,
  SectionTitle,
  Segmented,
  Stepper,
  Subtitle,
  TextField,
  ToggleField,
} from '@/components/ui';
import type {
  BudgetCategorie,
  BudgetLine,
  Civilite,
  Foyer,
  ModeFiscal,
  Personne,
  Rattachement,
  TypeContrat,
} from '@/domain';
import { CIVILITE_LABELS, CONTRAT_LABELS, contratStable, nomPersonne } from '@/domain';
import { computeDefaultBudget } from '@/domain/defaults';
import { useComputed } from '@/store/useComputed';
import { useBudget, useFoyer, useLoan, useProperties, useRav, useStore } from '@/store/useStore';
import { formatEUR, radius, spacing, usePalette } from '@/theme';

const CATEGORIES: BudgetCategorie[] = ['Dépenses courantes', 'Provisions', 'Épargne'];

const CIVILITE_OPTIONS = (Object.keys(CIVILITE_LABELS) as Civilite[]).map((value) => ({
  value,
  label: value === 'Autre' ? 'Autre' : value,
}));
const CONTRAT_OPTIONS = (Object.keys(CONTRAT_LABELS) as TypeContrat[]).map((value) => ({
  value,
  label: CONTRAT_LABELS[value],
}));

function BudgetRow({ line }: { line: BudgetLine }) {
  const p = usePalette();
  const update = useStore((s) => s.updateBudgetLine);
  const remove = useStore((s) => s.removeBudgetLine);
  const [edit, setEdit] = useState(false);

  if (edit) {
    return (
      <View style={[styles.editBox, { borderColor: p.border }]}>
        <TextField label="Poste" value={line.poste} onChange={(poste) => update(line.id, { poste })} />
        <NumberField
          label="Montant mensuel"
          value={line.montantMensuel}
          onChange={(montantMensuel) => update(line.id, { montantMensuel })}
          suffix="€/mois"
        />
        <View style={{ flexDirection: 'row', gap: spacing.sm }}>
          <View style={{ flex: 1 }}>
            <Button title="OK" onPress={() => setEdit(false)} />
          </View>
          <Button title="Suppr." tone="negative" variant="ghost" onPress={() => remove(line.id)} />
        </View>
      </View>
    );
  }

  return (
    <Pressable onPress={() => setEdit(true)} style={styles.budgetRow}>
      <Pressable
        onPress={() => update(line.id, { actif: !line.actif })}
        hitSlop={8}
        style={[styles.check, { borderColor: line.actif ? p.accent : p.border, backgroundColor: line.actif ? p.accent : 'transparent' }]}>
        {line.actif ? <Text style={{ color: '#fff', fontSize: 12, fontWeight: '900' }}>✓</Text> : null}
      </Pressable>
      <Text style={{ flex: 1, color: line.actif ? p.text : p.textMuted, fontSize: 14, textDecorationLine: line.actif ? 'none' : 'line-through' }}>
        {line.poste}
      </Text>
      <Text style={{ color: line.actif ? p.text : p.textMuted, fontWeight: '700' }}>
        {formatEUR(line.montantMensuel)}
      </Text>
    </Pressable>
  );
}

export default function ResteAVivreScreen() {
  const p = usePalette();
  const rav = useRav();
  const setRav = useStore((s) => s.setRav);
  const foyer = useFoyer();
  const updatePersonne = useStore((s) => s.updatePersonne);
  const loan = useLoan();
  const setLoan = useStore((s) => s.setLoan);
  const showConjoint = rav.modeFiscal === 'Commun' || loan.revenuBancaireB > 0;
  const budget = useBudget();
  const addBudgetLine = useStore((s) => s.addBudgetLine);
  const setBudget = useStore((s) => s.setBudget);
  const setFoyer = useStore((s) => s.setFoyer);
  const properties = useProperties();
  const c = useComputed();
  const r = c.rav;
  const b = c.budget;

  const nbAdultes = showConjoint ? 2 : 1;
  const nbPersonnes = nbAdultes + Math.max(0, Math.floor(rav.nbEnfants));
  const hasRental = properties.length > 0;
  const scrollRef = useRef<ScrollView>(null);
  const [budgetY, setBudgetY] = useState(0);
  const recomputeBudget = () =>
    setBudget(
      computeDefaultBudget({
        nbAdultes,
        nbEnfants: rav.nbEnfants,
        surfaceM2: foyer.surfaceM2,
        nbBiensLocatifs: properties.length,
      }),
    );

  return (
    <Screen scrollRef={scrollRef}>
      {/* Hero RAV */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: spacing.lg }}>
          <BigStat label="RAV après impôts / mois" value={formatEUR(r.ravMensuelApres)} tone={r.ravMensuelApres >= 0 ? 'positive' : 'negative'} />
          {nbPersonnes > 1 ? <BigStat label="Par personne" value={formatEUR(r.ravParPersonneApres)} /> : null}
        </View>
        <Divider />
        <Row label="RAV avant impôts" value={formatEUR(r.ravMensuelAvant)} />
        <Row label="Total impôts mensuels modélisés" value={formatEUR(-r.totalImpotsMensuels)} tone="negative" />
      </Card>

      {/* Profil du foyer */}
      <Card>
        <SectionTitle>Profil du foyer</SectionTitle>
        <PersonneEditor index={0} title={showConjoint ? 'Personne 1' : 'Votre profil'} foyer={foyer} onChange={updatePersonne} />
        {showConjoint ? (
          <>
            <Divider />
            <PersonneEditor index={1} title="Personne 2 (conjoint·e)" foyer={foyer} onChange={updatePersonne} />
          </>
        ) : null}
      </Card>

      {/* Salaires & IR */}
      <Card>
        <SectionTitle>Salaires (net mensuel avant impôt)</SectionTitle>
        <Subtitle>
          Saisissez votre salaire NET (celui qui tombe sur le compte), AVANT impôt sur le revenu.
          L'app estime l'IR et en déduit le net après impôt.
        </Subtitle>
        <NumberField label={showConjoint ? `${nomPersonne(foyer, 0)} — salaire net mensuel (avant IR)` : 'Salaire net mensuel (avant IR)'} value={loan.revenuBancaireA} onChange={(v) => setLoan({ revenuBancaireA: v })} suffix="€/mois" />
        {showConjoint ? (
          <NumberField label={`${nomPersonne(foyer, 1)} — salaire net mensuel (avant IR)`} value={loan.revenuBancaireB} onChange={(v) => setLoan({ revenuBancaireB: v })} suffix="€/mois" />
        ) : null}

        <SectionTitle>Situation familiale</SectionTitle>
        <Segmented<ModeFiscal>
          options={[
            { value: 'Séparé', label: 'Célib. / séparé' },
            { value: 'Commun', label: 'Marié·e / PACS' },
          ]}
          value={rav.modeFiscal}
          onChange={(modeFiscal) => setRav({ modeFiscal })}
        />
        <Stepper label="Nombre d'enfants à charge" value={rav.nbEnfants} onChange={(nbEnfants) => setRav({ nbEnfants })} hint="0,5 part pour les 2 premiers, 1 part dès le 3e" />
        {rav.modeFiscal === 'Séparé' && rav.nbEnfants > 0 ? (
          <>
            <Text style={{ color: p.textSecondary, fontSize: 14, fontWeight: '600' }}>Enfants rattachés à</Text>
            <Segmented<Rattachement>
              options={[
                { value: 'A', label: nomPersonne(foyer, 0) },
                { value: 'B', label: nomPersonne(foyer, 1) },
              ]}
              value={rav.rattachementEnfant}
              onChange={(rattachementEnfant) => setRav({ rattachementEnfant })}
            />
            <ToggleField label="Parent isolé" value={rav.parentIsole} onChange={(parentIsole) => setRav({ parentIsole })} hint="Demi-part supplémentaire (case T)" />
          </>
        ) : null}
        <Divider />
        {r.salaires
          .filter((s, i) => i === 0 || showConjoint)
          .map((s) => (
            <Row key={s.nom} label={`${s.nom} — net après IR`} value={formatEUR(s.netMensuel)} hint={`IR ${formatEUR(s.irMensuel)}/mois · ${s.parts} part(s)`} />
          ))}
        <Row label="Total salaires net après IR" value={formatEUR(r.netSalaireMensuel)} strong />
      </Card>

      {/* Locatif — masqué si aucune location dans le scénario */}
      {hasRental ? (
        <Card>
          <SectionTitle>Apport des locations au reste à vivre</SectionTitle>
          <Row label="Recettes fiscales HC / mois" value={formatEUR(r.recettesHCMensuel)} />
          <Row label="Charges cash / mois" value={formatEUR(-r.chargesCashMensuel)} tone="negative" />
          <Row label="Impôts locatifs / mois" value={formatEUR(-r.impotsLocatifMensuel)} tone="negative" />
          <Row label="Net locatif après fiscalité" value={formatEUR(r.netLocatifMensuel)} tone="positive" strong />
          {r.capitalApproxApparts > 0 ? (
            <Row label="Capital prêts appartements" value={formatEUR(-r.capitalApproxApparts)} tone="negative" hint="Intérêts déjà comptés dans les charges" />
          ) : null}
          <Divider />
          <Row label="Contribution nette au RAV" value={formatEUR(r.contributionLocativeNette)} strong tone="accent" />
        </Card>
      ) : null}

      {/* Vue consolidée */}
      <Card>
        <SectionTitle>Reste à vivre consolidé</SectionTitle>
        <View style={[styles.tableHead, { borderColor: p.border }]}>
          <Text style={[styles.th, { color: p.textMuted, flex: 1 }]}> </Text>
          <Text style={[styles.th, { color: p.textMuted }]}>Avant IR</Text>
          <Text style={[styles.th, { color: p.textMuted }]}>Après IR</Text>
        </View>
        {r.lignes
          .filter((l) => l.avant !== 0 || l.apres !== 0)
          .map((l) => (
            <View key={l.libelle} style={styles.tableRow}>
              <Text style={{ flex: 1, color: p.textSecondary, fontSize: 13 }}>{l.libelle}</Text>
              <Text style={[styles.td, { color: p.textMuted }]}>{formatEUR(l.avant)}</Text>
              <Text style={[styles.td, { color: l.apres < 0 ? p.negative : p.text, fontWeight: '600' }]}>{formatEUR(l.apres)}</Text>
            </View>
          ))}
        <Divider />
        <View style={styles.tableRow}>
          <Text style={{ flex: 1, color: p.text, fontWeight: '800' }}>Reste à vivre</Text>
          <Text style={[styles.td, { color: p.textSecondary, fontWeight: '700' }]}>{formatEUR(r.ravMensuelAvant)}</Text>
          <Text style={[styles.td, { color: r.ravMensuelApres >= 0 ? p.positive : p.negative, fontWeight: '800' }]}>{formatEUR(r.ravMensuelApres)}</Text>
        </View>
        <NumberField label="Autres charges fixes mensuelles" value={rav.autresChargesFixesMensuelles} onChange={(v) => setRav({ autresChargesFixesMensuelles: v })} suffix="€/mois" />
      </Card>

      {/* Budget courant */}
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <BigStat
            label="Reste libre final / mois"
            value={formatEUR(b.resteLibreFinal)}
            tone={b.resteLibreFinal >= 0 ? 'positive' : 'negative'}
            caption={nbAdultes > 1 ? `Par adulte ${formatEUR(b.resteLibreParAdulte)}` : undefined}
          />
          <Badge text={b.resteLibreFinal >= 0 ? 'Équilibré' : 'Déficit'} tone={b.resteLibreFinal >= 0 ? 'positive' : 'negative'} />
        </View>
        <Divider />
        <Row label="RAV après impôts" value={formatEUR(b.ravApresImpots)} />
        <Row label="− Dépenses courantes" value={formatEUR(-b.totalDepensesCourantes)} tone="negative" />
        {b.totalProvisions > 0 ? (
          <Row label="− Provisions bailleur" value={formatEUR(-b.totalProvisions)} tone="negative" />
        ) : null}
        <Row label="− Épargne" value={formatEUR(-b.totalEpargne)} tone="negative" />
        <Button
          title="✎ Modifier mes dépenses ↓"
          variant="ghost"
          onPress={() => scrollRef.current?.scrollTo({ y: Math.max(0, budgetY - 12), animated: true })}
        />
      </Card>

      {/* Estimation / personnalisation du budget */}
      <Card>
        <SectionTitle>Estimer mon budget</SectionTitle>
        <Subtitle>
          Ces montants sont des estimations de départ calculées pour {nbPersonnes} personne
          {nbPersonnes > 1 ? 's' : ''} et un logement de {foyer.surfaceM2} m². Ce ne sont pas vos
          vraies dépenses : ajustez chaque poste pour coller à votre situation.
        </Subtitle>
        <NumberField
          label="Surface de mon logement"
          value={foyer.surfaceM2}
          onChange={(surfaceM2) => setFoyer({ surfaceM2 })}
          suffix="m²"
        />
        <Button title="↻ Recalculer une estimation" variant="ghost" onPress={recomputeBudget} />
        <Text style={{ color: p.textMuted, fontSize: 12, lineHeight: 16 }}>
          Recalculer remplace tous les postes ci-dessous par une nouvelle estimation (vos
          personnalisations seront écrasées).
        </Text>
      </Card>

      <View
        onLayout={(e) => setBudgetY(e.nativeEvent.layout.y)}
        style={{ gap: spacing.lg }}>
        {CATEGORIES.map((cat) => (
          <Card key={cat}>
            <SectionTitle>{cat}</SectionTitle>
            {budget.filter((l) => l.categorie === cat).map((line) => (
              <BudgetRow key={line.id} line={line} />
            ))}
            <Pressable onPress={() => addBudgetLine(cat)} style={{ paddingTop: spacing.xs }}>
              <Text style={{ color: p.accent, fontWeight: '700' }}>＋ Ajouter un poste</Text>
            </Pressable>
          </Card>
        ))}
      </View>

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

function PersonneEditor({
  index,
  title,
  foyer,
  onChange,
}: {
  index: number;
  title: string;
  foyer: Foyer;
  onChange: (index: number, patch: Partial<Personne>) => void;
}) {
  const p = usePalette();
  const per = foyer.personnes[index] ?? { civilite: 'Autre', prenom: '', contrat: 'CDI' };
  return (
    <View style={{ gap: spacing.sm }}>
      <Text style={{ color: p.textMuted, fontSize: 12, fontWeight: '700' }}>{title.toUpperCase()}</Text>
      <ChipSelect<Civilite> label="Civilité" options={CIVILITE_OPTIONS} value={per.civilite} onChange={(civilite) => onChange(index, { civilite })} />
      <TextField label="Prénom (facultatif)" value={per.prenom} onChange={(prenom) => onChange(index, { prenom })} />
      <ChipSelect<TypeContrat>
        label="Statut professionnel"
        options={CONTRAT_OPTIONS}
        value={per.contrat}
        onChange={(contrat) => onChange(index, { contrat })}
        hint={
          contratStable(per.contrat)
            ? 'Revenu généralement compté à 100 % par les banques.'
            : 'Revenu souvent décoté par les banques (plusieurs bilans / ancienneté exigés).'
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  budgetRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm },
  check: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editBox: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
    marginVertical: spacing.xs,
  },
  tableHead: { flexDirection: 'row', borderBottomWidth: StyleSheet.hairlineWidth, paddingBottom: spacing.xs },
  tableRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  th: { width: 90, textAlign: 'right', fontSize: 11, fontWeight: '700', textTransform: 'uppercase' },
  td: { width: 90, textAlign: 'right', fontSize: 13 },
});
