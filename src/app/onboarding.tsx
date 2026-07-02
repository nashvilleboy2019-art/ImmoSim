import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Button,
  ChipSelect,
  ChoiceCard,
  NumberField,
  ProgressBar,
  Segmented,
  Stepper,
  TextField,
  ToggleField,
} from '@/components/ui';
import {
  CIVILITE_LABELS,
  CONTRAT_LABELS,
  contratStable,
  type Civilite,
  type ModeFiscal,
  type PatrimoineItem,
  type Personne,
  type Property,
  type TypeContrat,
} from '@/domain';
import { computeDefaultBudget } from '@/domain/defaults';
import { useStore, useTax } from '@/store/useStore';
import { radius, spacing, usePalette } from '@/theme';

type ProjectType = 'rp' | 'locatif' | 'les_deux';
type Intention = 'louer' | 'revendre' | 'garder';
type BiensChoice = 'oui_actif' | 'oui_garde' | 'non';

interface BienDraft {
  id: string;
  nom: string;
  intention: Intention;
  meuble: boolean;
  loyerMensuel: number;
  mensualiteCreditActuel: number;
  valo: number;
  resteDu: number;
}

const CIVILITE_OPTIONS = (Object.keys(CIVILITE_LABELS) as Civilite[]).map((value) => ({
  value,
  label: value === 'Autre' ? 'Autre' : value,
}));
const CONTRAT_OPTIONS = (Object.keys(CONTRAT_LABELS) as TypeContrat[]).map((value) => ({
  value,
  label: CONTRAT_LABELS[value],
}));

const emptyPersonne = (): Personne => ({ civilite: 'Autre', prenom: '', contrat: 'CDI' });

const STEPS = ['Projet', 'Foyer', 'Revenus', 'Achat', 'Biens', 'Crédits', 'Récap'] as const;

export default function Onboarding() {
  const p = usePalette();
  const router = useRouter();
  const setLoan = useStore((s) => s.setLoan);
  const setRav = useStore((s) => s.setRav);
  const setFoyer = useStore((s) => s.setFoyer);
  const setBudget = useStore((s) => s.setBudget);
  const setProperties = useStore((s) => s.setProperties);
  const setPatrimoine = useStore((s) => s.setPatrimoine);
  const tax = useTax();
  const completeOnboarding = useStore((s) => s.completeOnboarding);

  const [step, setStep] = useState(0);

  // Draft
  const [projectType, setProjectType] = useState<ProjectType>('les_deux');
  const [avecConjoint, setAvecConjoint] = useState(false);
  const [modeFiscal, setModeFiscal] = useState<ModeFiscal>('Commun');
  const [p1, setP1] = useState<Personne>(emptyPersonne());
  const [p2, setP2] = useState<Personne>(emptyPersonne());
  const [nbEnfants, setNbEnfants] = useState(0);
  const [revenuA, setRevenuA] = useState(0);
  const [revenuB, setRevenuB] = useState(0);
  // Achat
  const [prixBien, setPrixBien] = useState(0);
  const [apport, setApport] = useState(0);
  const [surfaceM2, setSurfaceM2] = useState(70);
  const [typeBien, setTypeBien] = useState<'appartement' | 'maison'>('appartement');
  const [chauffageElectrique, setChauffageElectrique] = useState(false);
  // Biens existants
  const [biensChoice, setBiensChoice] = useState<BiensChoice | null>(null);
  const [biens, setBiens] = useState<BienDraft[]>([]);
  // Crédits
  const [autresCredits, setAutresCredits] = useState(0);

  const updateP1 = (patch: Partial<Personne>) => setP1((x) => ({ ...x, ...patch }));
  const updateP2 = (patch: Partial<Personne>) => setP2((x) => ({ ...x, ...patch }));

  const addBien = (intention: Intention) =>
    setBiens((b) => [
      ...b,
      {
        id: `${Date.now()}-${b.length}`,
        nom: `Bien ${b.length + 1}`,
        intention,
        meuble: true,
        loyerMensuel: 0,
        mensualiteCreditActuel: 0,
        valo: 0,
        resteDu: 0,
      },
    ]);
  const updateBien = (id: string, patch: Partial<BienDraft>) =>
    setBiens((b) => b.map((x) => (x.id === id ? { ...x, ...patch } : x)));
  const removeBien = (id: string) => setBiens((b) => b.filter((x) => x.id !== id));

  const pickBiensChoice = (choice: BiensChoice) => {
    setBiensChoice(choice);
    if (choice === 'non') setBiens([]);
    else if (biens.length === 0) addBien(choice === 'oui_garde' ? 'garder' : 'louer');
  };

  const nom1 = p1.prenom.trim() || 'Vous';
  const nom2 = p2.prenom.trim() || 'Conjoint·e';

  const finish = () => {
    setFoyer({ personnes: [p1, avecConjoint ? p2 : emptyPersonne()], surfaceM2 });
    setLoan({
      prixBien,
      apport,
      revenuBancaireA: revenuA,
      revenuBancaireB: avecConjoint ? revenuB : 0,
      autresMensualitesCredits: autresCredits,
    });
    setRav({ modeFiscal: avecConjoint ? modeFiscal : 'Séparé', nbEnfants });

    const louer = biens.filter((b) => b.intention === 'louer');
    setBudget(
      computeDefaultBudget({
        nbAdultes: avecConjoint ? 2 : 1,
        nbEnfants,
        surfaceM2,
        nbBiensLocatifs: louer.length,
        hasExterieur: typeBien === 'maison',
        chauffageElectrique,
      }),
    );

    const properties: Property[] = louer.map((b) => ({
      id: b.id,
      nom: b.nom || 'Bien locatif',
      proprietaire: '',
      loyerMensuel: b.loyerMensuel,
      chargesRecuperablesMensuelles: 0,
      mensualiteCreditActuel: b.mensualiteCreditActuel,
      chargesCoproNonRecup: 0,
      taxeFonciere: 0,
      assurancePNO: 0,
      interetsEmprunt: 0,
      travaux: 0,
      autresChargesDeductibles: 0,
      cfe: 0,
      comptable: 0,
      amortissementBien: 0,
      amortissementMeubles: 0,
      tmi: tax.tmiIR,
      regime: b.meuble ? 'reelLMNP' : 'nue',
    }));
    setProperties(properties);

    // Tous les biens existants alimentent le patrimoine (valorisation + dette).
    const patrimoine: PatrimoineItem[] = [];
    biens.forEach((b) => {
      if (b.valo > 0)
        patrimoine.push({ id: `${b.id}-v`, type: 'immobilier', libelle: `${b.nom} (valorisation)`, montant: b.valo });
      if (b.resteDu > 0)
        patrimoine.push({ id: `${b.id}-d`, type: 'dette', libelle: `Capital restant dû — ${b.nom}`, montant: b.resteDu });
    });
    setPatrimoine(patrimoine);

    completeOnboarding(projectType);
    router.replace('/');
  };

  const canNext = (() => {
    if (step === 4 && biensChoice === null) return false;
    return true;
  })();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }}>
      <View style={{ paddingHorizontal: spacing.xl, paddingTop: spacing.md, gap: spacing.sm }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={{ color: p.textMuted, fontSize: 13, fontWeight: '600' }}>
            Étape {step + 1} / {STEPS.length} · {STEPS[step]}
          </Text>
          <Pressable onPress={finish} hitSlop={8}>
            <Text style={{ color: p.textMuted, fontSize: 13 }}>Passer</Text>
          </Pressable>
        </View>
        <ProgressBar value={(step + 1) / STEPS.length} />
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing.xl, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        {step === 0 ? (
          <Step title="Quel est votre projet ?" subtitle="On adapte la simulation à votre objectif.">
            <ChoiceCard emoji="🏡" title="Acheter ma résidence principale" description="Estimer ce que je peux emprunter et mon reste à vivre." selected={projectType === 'rp'} onPress={() => setProjectType('rp')} />
            <ChoiceCard emoji="📈" title="Investir dans du locatif" description="Optimiser la fiscalité et le cash-flow de mes locations." selected={projectType === 'locatif'} onPress={() => setProjectType('locatif')} />
            <ChoiceCard emoji="🎯" title="Les deux / vision globale" description="Acheter ma résidence tout en gardant mes biens locatifs." selected={projectType === 'les_deux'} onPress={() => setProjectType('les_deux')} />
          </Step>
        ) : null}

        {step === 1 ? (
          <Step title="Votre foyer" subtitle="Quelques infos pour estimer vos impôts et la lecture des banques.">
            <Text style={{ color: p.textSecondary, fontSize: 14, fontWeight: '600' }}>Vous simulez…</Text>
            <Segmented<'seul' | 'couple'>
              options={[
                { value: 'seul', label: 'Seul·e' },
                { value: 'couple', label: 'En couple' },
              ]}
              value={avecConjoint ? 'couple' : 'seul'}
              onChange={(v) => setAvecConjoint(v === 'couple')}
            />
            {avecConjoint ? (
              <>
                <Text style={{ color: p.textSecondary, fontSize: 14, fontWeight: '600' }}>Votre imposition</Text>
                <Segmented<ModeFiscal>
                  options={[
                    { value: 'Commun', label: 'Marié·e / PACS' },
                    { value: 'Séparé', label: 'Concubinage' },
                  ]}
                  value={modeFiscal}
                  onChange={setModeFiscal}
                />
              </>
            ) : null}

            <ProfilCard title={avecConjoint ? 'Personne 1' : 'Votre profil'} per={p1} onChange={updateP1} />
            {avecConjoint ? <ProfilCard title="Personne 2 (conjoint·e)" per={p2} onChange={updateP2} /> : null}

            <Stepper label="Nombre d'enfants à charge" value={nbEnfants} onChange={setNbEnfants} hint="Pour estimer vos parts fiscales" />
          </Step>
        ) : null}

        {step === 2 ? (
          <Step title="Vos revenus" subtitle="Salaire NET mensuel (celui versé sur le compte), AVANT impôt sur le revenu. Hors loyers.">
            <NumberField label={`${nom1} — salaire net mensuel`} value={revenuA} onChange={setRevenuA} suffix="€/mois" />
            {avecConjoint ? (
              <NumberField label={`${nom2} — salaire net mensuel`} value={revenuB} onChange={setRevenuB} suffix="€/mois" />
            ) : null}
            {!contratStable(p1.contrat) || (avecConjoint && !contratStable(p2.contrat)) ? (
              <Text style={{ color: p.warning, fontSize: 13, lineHeight: 18 }}>
                ⚠︎ Un revenu hors CDI / fonction publique est souvent décoté par les banques. On le compte
                ici pour le reste à vivre, mais votre capacité d'emprunt réelle peut être plus prudente.
              </Text>
            ) : null}
          </Step>
        ) : null}

        {step === 3 ? (
          <Step
            title={projectType === 'locatif' ? 'Le bien que vous visez' : 'Votre futur achat'}
            subtitle="Laissez le prix à 0 si vous n'achetez rien pour l'instant. Ces précisions affinent l'estimation de vos charges.">
            <NumberField label="Prix du bien" value={prixBien} onChange={setPrixBien} suffix="€" />
            <NumberField label="Apport disponible" value={apport} onChange={setApport} suffix="€" hint="Épargne que vous mettez dans l'achat" />
            <NumberField label="Surface du bien" value={surfaceM2} onChange={setSurfaceM2} suffix="m²" hint="Sert à estimer énergie, taxe foncière et entretien" />
            <Text style={{ color: p.textSecondary, fontSize: 14, fontWeight: '600' }}>Type de bien</Text>
            <Segmented<'appartement' | 'maison'>
              options={[
                { value: 'appartement', label: '🏢 Appartement' },
                { value: 'maison', label: '🏡 Maison' },
              ]}
              value={typeBien}
              onChange={setTypeBien}
            />
            {typeBien === 'maison' ? (
              <Text style={{ color: p.textMuted, fontSize: 12, lineHeight: 16 }}>
                Une maison ajoute de l'entretien (jardin/extérieur) au budget estimé.
              </Text>
            ) : null}
            <ToggleField
              label="Chauffage tout électrique"
              value={chauffageElectrique}
              onChange={setChauffageElectrique}
              hint="Augmente la facture d'énergie estimée"
            />
          </Step>
        ) : null}

        {step === 4 ? (
          <Step title="Possédez-vous déjà des biens immobiliers ?" subtitle="Appartements, maison, studio… qu'ils soient loués, à vendre ou simplement conservés.">
            <ChoiceCard
              emoji="🔑"
              title="Oui — à louer ou à revendre"
              description="Je les mets en location ou je compte les vendre."
              selected={biensChoice === 'oui_actif'}
              onPress={() => pickBiensChoice('oui_actif')}
            />
            <ChoiceCard
              emoji="🏠"
              title="Oui — mais je les garde"
              description="Je les conserve, sans les louer ni les vendre (résidence, secondaire…)."
              selected={biensChoice === 'oui_garde'}
              onPress={() => pickBiensChoice('oui_garde')}
            />
            <ChoiceCard
              emoji="🚫"
              title="Non, pas encore"
              description="Je ne possède aucun bien immobilier pour le moment."
              selected={biensChoice === 'non'}
              onPress={() => pickBiensChoice('non')}
            />

            {biensChoice && biensChoice !== 'non' ? (
              <>
                {biens.map((b, i) => (
                  <View key={b.id} style={[styles.bienCard, { backgroundColor: p.card, borderColor: p.border }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={{ color: p.textMuted, fontWeight: '700', fontSize: 12 }}>BIEN {i + 1}</Text>
                      <Pressable onPress={() => removeBien(b.id)} hitSlop={8}>
                        <Text style={{ color: p.negative, fontSize: 18 }}>×</Text>
                      </Pressable>
                    </View>
                    <TextField label="Nom du bien" value={b.nom} onChange={(nom) => updateBien(b.id, { nom })} />
                    <Text style={{ color: p.textSecondary, fontSize: 14, fontWeight: '600' }}>Qu'en faites-vous ?</Text>
                    <Segmented<Intention>
                      options={[
                        { value: 'louer', label: '🔑 Louer' },
                        { value: 'revendre', label: '💰 Revendre' },
                        { value: 'garder', label: '🏠 Garder' },
                      ]}
                      value={b.intention}
                      onChange={(intention) => updateBien(b.id, { intention })}
                    />
                    {b.intention === 'louer' ? (
                      <>
                        <Segmented<'meuble' | 'nu'>
                          options={[
                            { value: 'meuble', label: 'Meublé (LMNP)' },
                            { value: 'nu', label: 'Nu' },
                          ]}
                          value={b.meuble ? 'meuble' : 'nu'}
                          onChange={(v) => updateBien(b.id, { meuble: v === 'meuble' })}
                        />
                        <NumberField label="Loyer mensuel encaissé" value={b.loyerMensuel} onChange={(loyerMensuel) => updateBien(b.id, { loyerMensuel })} suffix="€" />
                        <NumberField label="Mensualité du crédit actuel" value={b.mensualiteCreditActuel} onChange={(mensualiteCreditActuel) => updateBien(b.id, { mensualiteCreditActuel })} suffix="€/mois" hint="0 si le bien est déjà payé" />
                      </>
                    ) : null}
                    <NumberField label="Valeur estimée du bien" value={b.valo} onChange={(valo) => updateBien(b.id, { valo })} suffix="€" />
                    <NumberField label="Capital restant dû" value={b.resteDu} onChange={(resteDu) => updateBien(b.id, { resteDu })} suffix="€" hint="Ce qu'il reste à rembourser sur ce bien (0 si payé)" />
                  </View>
                ))}
                <Pressable onPress={() => addBien(biensChoice === 'oui_garde' ? 'garder' : 'louer')} style={[styles.addBien, { borderColor: p.accent }]}>
                  <Text style={{ color: p.accent, fontWeight: '700' }}>＋ Ajouter un bien</Text>
                </Pressable>
                <Text style={{ color: p.textMuted, fontSize: 12, lineHeight: 17 }}>
                  Les détails fiscaux (taxe foncière, amortissements…) se peaufineront ensuite dans l'onglet Fiscalité.
                </Text>
              </>
            ) : null}
          </Step>
        ) : null}

        {step === 5 ? (
          <Step
            title="Vos crédits en cours"
            subtitle="Les mensualités de vos crédits actuels réduisent votre capacité d'emprunt. Hors biens locatifs déjà saisis à l'étape précédente.">
            <NumberField
              label="Mensualité totale de vos autres crédits"
              value={autresCredits}
              onChange={setAutresCredits}
              suffix="€/mois"
              hint="Immobilier non locatif (résidence, secondaire), auto, prêt conso… 0 si aucun."
            />
          </Step>
        ) : null}

        {step === 6 ? (
          <Step title="Tout est prêt ✨" subtitle="Voici ce qu'on va simuler. Vous pourrez tout ajuster ensuite.">
            <Recap label="Projet" value={projectType === 'rp' ? 'Résidence principale' : projectType === 'locatif' ? 'Investissement locatif' : 'Vision globale'} />
            <Recap
              label="Foyer"
              value={`${avecConjoint ? `Couple · ${modeFiscal === 'Commun' ? 'Marié/PACS' : 'Concubinage'}` : 'Seul·e'}${nbEnfants > 0 ? ` · ${nbEnfants} enfant${nbEnfants > 1 ? 's' : ''}` : ''}`}
            />
            <Recap label="Revenus" value={`${(revenuA + (avecConjoint ? revenuB : 0)).toLocaleString('fr-FR')} €/mois net`} />
            {prixBien > 0 ? <Recap label="Bien visé" value={`${prixBien.toLocaleString('fr-FR')} € · ${surfaceM2} m² · apport ${apport.toLocaleString('fr-FR')} €`} /> : null}
            <Recap label="Biens loués" value={`${biens.filter((b) => b.intention === 'louer').length}`} />
            <Recap label="Biens à revendre" value={`${biens.filter((b) => b.intention === 'revendre').length}`} />
            <Recap label="Biens conservés" value={`${biens.filter((b) => b.intention === 'garder').length}`} />
            {autresCredits > 0 ? <Recap label="Autres crédits" value={`${autresCredits.toLocaleString('fr-FR')} €/mois`} /> : null}
          </Step>
        ) : null}
      </ScrollView>

      <View style={{ flexDirection: 'row', gap: spacing.sm, padding: spacing.xl, paddingTop: spacing.md }}>
        {step > 0 ? (
          <View style={{ flex: 1 }}>
            <Button title="← Retour" variant="ghost" onPress={() => setStep((s) => s - 1)} />
          </View>
        ) : null}
        <View style={{ flex: 2 }}>
          {step < STEPS.length - 1 ? (
            <Button title={canNext ? 'Continuer →' : 'Choisissez une option'} onPress={() => canNext && setStep((s) => s + 1)} />
          ) : (
            <Button title="Voir ma simulation 🎉" onPress={finish} />
          )}
        </View>
      </View>
    </SafeAreaView>
  );
}

function ProfilCard({
  title,
  per,
  onChange,
}: {
  title: string;
  per: Personne;
  onChange: (patch: Partial<Personne>) => void;
}) {
  const p = usePalette();
  return (
    <View style={[styles.bienCard, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={{ color: p.textMuted, fontWeight: '700', fontSize: 12 }}>{title.toUpperCase()}</Text>
      <ChipSelect<Civilite> label="Civilité" options={CIVILITE_OPTIONS} value={per.civilite} onChange={(civilite) => onChange({ civilite })} />
      <TextField label="Prénom (facultatif)" value={per.prenom} onChange={(prenom) => onChange({ prenom })} />
      <ChipSelect<TypeContrat> label="Statut professionnel" options={CONTRAT_OPTIONS} value={per.contrat} onChange={(contrat) => onChange({ contrat })} />
    </View>
  );
}

function Step({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  const p = usePalette();
  return (
    <View style={{ gap: spacing.md }}>
      <View style={{ gap: 4 }}>
        <Text style={{ color: p.text, fontSize: 24, fontWeight: '800', letterSpacing: -0.4 }}>{title}</Text>
        {subtitle ? <Text style={{ color: p.textSecondary, fontSize: 14, lineHeight: 20 }}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function Recap({ label, value }: { label: string; value: string }) {
  const p = usePalette();
  return (
    <View style={[styles.recap, { backgroundColor: p.card, borderColor: p.border }]}>
      <Text style={{ color: p.textSecondary, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: p.text, fontSize: 15, fontWeight: '700', flexShrink: 1, textAlign: 'right' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bienCard: { borderWidth: StyleSheet.hairlineWidth, borderRadius: radius.lg, padding: spacing.lg, gap: spacing.sm },
  addBien: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center' },
  recap: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, borderWidth: StyleSheet.hairlineWidth },
});
