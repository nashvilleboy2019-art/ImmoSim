import { useRouter } from 'expo-router';
import { Alert, Platform, View } from 'react-native';

import {
  Button,
  Card,
  NumberField,
  PercentField,
  Screen,
  SectionTitle,
  Subtitle,
} from '@/components/ui';
import { useRav, useStore, useTax } from '@/store/useStore';
import { spacing } from '@/theme';

export default function ParametresScreen() {
  const router = useRouter();
  const tax = useTax();
  const setTax = useStore((s) => s.setTax);
  const rav = useRav();
  const setRav = useStore((s) => s.setRav);
  const resetAll = useStore((s) => s.resetAll);
  const restartOnboarding = useStore((s) => s.restartOnboarding);

  const confirmReset = () => {
    if (Platform.OS === 'web') {
      resetAll();
      return;
    }
    Alert.alert('Réinitialiser', 'Remettre toutes les valeurs par défaut ? Vos saisies seront perdues.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Réinitialiser', style: 'destructive', onPress: resetAll },
    ]);
  };

  return (
    <Screen>
      <Card>
        <SectionTitle>Hypothèses fiscales — locations</SectionTitle>
        <PercentField label="Prélèvements sociaux — location nue" value={tax.psNue} onChange={(v) => setTax({ psNue: v })} />
        <PercentField label="Prélèvements sociaux — LMNP" value={tax.psLMNP} onChange={(v) => setTax({ psLMNP: v })} />
        <PercentField label="Abattement micro-foncier" value={tax.abattementMicroFoncier} onChange={(v) => setTax({ abattementMicroFoncier: v })} />
        <NumberField label="Seuil micro-foncier / foyer" value={tax.seuilMicroFoncier} onChange={(v) => setTax({ seuilMicroFoncier: v })} suffix="€" />
        <PercentField label="Abattement micro-BIC" value={tax.abattementMicroBIC} onChange={(v) => setTax({ abattementMicroBIC: v })} />
        <NumberField label="Seuil micro-BIC" value={tax.seuilMicroBIC} onChange={(v) => setTax({ seuilMicroBIC: v })} suffix="€" />
      </Card>

      <Card>
        <SectionTitle>Hypothèses — impôt sur le revenu</SectionTitle>
        <PercentField label="Abattement frais professionnels" value={rav.abattementFraisPro} onChange={(v) => setRav({ abattementFraisPro: v })} hint="Forfait 10 % sur salaires" />
        <NumberField label="Plafond avantage demi-part enfant" value={rav.plafondDemiPartEnfant} onChange={(v) => setRav({ plafondDemiPartEnfant: v })} suffix="€/an" />
        <Subtitle>
          Barème IR progressif indicatif 2026 (tranches 0 / 11 / 30 / 41 / 45 %). À confronter au
          simulateur officiel des impôts pour un calcul exact.
        </Subtitle>
      </Card>

      <Card>
        <SectionTitle>Configuration guidée</SectionTitle>
        <Subtitle>Relancez le parcours de configuration pour ajuster votre profil étape par étape.</Subtitle>
        <Button
          title="Refaire la configuration guidée"
          onPress={() => {
            restartOnboarding();
            router.push('/onboarding');
          }}
        />
      </Card>

      <Card>
        <SectionTitle>Données</SectionTitle>
        <Subtitle>
          Toutes vos saisies sont enregistrées localement sur cet appareil. Aucune donnée n'est
          envoyée en ligne.
        </Subtitle>
        <Button title="Réinitialiser aux valeurs par défaut" tone="negative" variant="ghost" onPress={confirmReset} />
      </Card>

      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}
