import { Text, View } from 'react-native';

import { ComparisonBars, Legend, type BarDatum } from '@/components/charts';
import { Card, Screen, SectionTitle, Subtitle } from '@/components/ui';
import type { ComputedSimulation } from '@/domain';
import { useAllComputed } from '@/store/useComputed';
import { formatEUR, formatPct, spacing, usePalette } from '@/theme';

interface Metric {
  title: string;
  sub?: string;
  pick: (c: ComputedSimulation) => number;
  format: (v: number) => string;
  higherIsBetter: boolean;
}

const METRICS: Metric[] = [
  { title: 'Marge bancaire / mois', sub: 'Capacité restante − mensualité', pick: (c) => c.loan.margeBancaire, format: (v) => formatEUR(v), higherIsBetter: true },
  { title: 'Mensualité maison', pick: (c) => c.loan.mensualiteMaison, format: (v) => formatEUR(v), higherIsBetter: false },
  { title: 'Reste à vivre après impôts', pick: (c) => c.rav.ravMensuelApres, format: (v) => formatEUR(v), higherIsBetter: true },
  { title: 'Reste libre après budget', pick: (c) => c.budget.resteLibreFinal, format: (v) => formatEUR(v), higherIsBetter: true },
  { title: 'Cash net locatif / mois', pick: (c) => c.rental.cashNetMensuel, format: (v) => formatEUR(v), higherIsBetter: true },
  { title: 'Impôts modélisés / mois', pick: (c) => c.rav.totalImpotsMensuels, format: (v) => formatEUR(v), higherIsBetter: false },
  { title: "Taux d'effort", pick: (c) => c.loan.tauxEffortGlobal, format: (v) => formatPct(v), higherIsBetter: false },
  { title: 'Patrimoine net', pick: (c) => c.patrimoine.patrimoineNet, format: (v) => formatEUR(v), higherIsBetter: true },
];

export default function ComparaisonScreen() {
  const p = usePalette();
  const all = useAllComputed();

  if (all.length < 2) {
    return (
      <Screen>
        <Card>
          <SectionTitle>Comparaison</SectionTitle>
          <Subtitle>
            Créez au moins deux scénarios pour les comparer ici (par ex. « avec PTZ » vs « sans
            PTZ », ou deux prix de maison). Gérez vos scénarios depuis le bouton « Scénarios » du
            tableau de bord.
          </Subtitle>
        </Card>
      </Screen>
    );
  }

  const legend = all.map((a) => ({ label: a.scenario.name, color: a.scenario.color }));

  return (
    <Screen>
      <Card>
        <SectionTitle>Scénarios comparés</SectionTitle>
        <Legend items={legend} />
      </Card>

      {METRICS.map((m) => {
        const data: BarDatum[] = all.map((a) => ({
          label: a.scenario.name,
          value: m.pick(a.computed),
          color: a.scenario.color,
        }));
        const values = data.map((d) => d.value);
        const bestVal = m.higherIsBetter ? Math.max(...values) : Math.min(...values);
        const best = all.find((a) => m.pick(a.computed) === bestVal);
        return (
          <Card key={m.title}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={{ flex: 1 }}>
                <SectionTitle>{m.title}</SectionTitle>
                {m.sub ? <Text style={{ color: p.textMuted, fontSize: 12, marginTop: -6, marginBottom: 4 }}>{m.sub}</Text> : null}
              </View>
            </View>
            <ComparisonBars data={data} format={m.format} />
            {best ? (
              <Text style={{ color: p.positive, fontSize: 12.5, fontWeight: '600' }}>
                ★ Meilleur : {best.scenario.name} ({m.format(bestVal)})
              </Text>
            ) : null}
          </Card>
        );
      })}

      <Subtitle>
        Astuce : dupliquez un scénario, changez un paramètre (prix, apport, régime fiscal…) et
        revenez ici pour voir l'impact côte à côte.
      </Subtitle>
    </Screen>
  );
}
