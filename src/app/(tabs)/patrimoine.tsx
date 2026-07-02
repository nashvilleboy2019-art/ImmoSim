import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  BigStat,
  Card,
  Divider,
  NumberField,
  Row,
  Screen,
  SectionTitle,
  Subtitle,
  TextField,
} from '@/components/ui';
import type { PatrimoineItem, PatrimoineType } from '@/domain';
import { useComputed } from '@/store/useComputed';
import { usePatrimoineItems, useStore } from '@/store/useStore';
import { formatEUR, radius, spacing, usePalette } from '@/theme';

const SECTIONS: { type: PatrimoineType; title: string; emoji: string }[] = [
  { type: 'liquidites', title: 'Liquidités', emoji: '💧' },
  { type: 'placement', title: 'Placements', emoji: '📈' },
  { type: 'immobilier', title: 'Immobilier (valorisation)', emoji: '🏠' },
  { type: 'dette', title: 'Dettes (capital restant dû)', emoji: '💳' },
];

function ItemRow({ item }: { item: PatrimoineItem }) {
  const p = usePalette();
  const update = useStore((s) => s.updatePatrimoine);
  const remove = useStore((s) => s.removePatrimoine);
  const isDette = item.type === 'dette';
  return (
    <View style={[styles.itemBox, { borderColor: p.border }]}>
      <View style={{ flex: 1, gap: spacing.xs }}>
        <TextField label="" value={item.libelle} onChange={(libelle) => update(item.id, { libelle })} />
      </View>
      <View style={{ width: 130 }}>
        <NumberField label="" value={item.montant} onChange={(montant) => update(item.id, { montant })} suffix={isDette ? '€−' : '€'} />
      </View>
      <Pressable onPress={() => remove(item.id)} hitSlop={8} style={{ paddingTop: 6 }}>
        <Text style={{ color: p.negative, fontSize: 20 }}>×</Text>
      </Pressable>
    </View>
  );
}

export default function PatrimoineScreen() {
  const p = usePalette();
  const items = usePatrimoineItems();
  const add = useStore((s) => s.addPatrimoine);
  const c = useComputed();
  const r = c.patrimoine;

  return (
    <Screen>
      <Card>
        <BigStat
          label="Patrimoine net"
          value={formatEUR(r.patrimoineNet)}
          tone={r.patrimoineNet >= 0 ? 'positive' : 'negative'}
          caption="Actifs − dettes"
        />
        <Divider />
        <Row label="💧 Liquidités" value={formatEUR(r.liquidites)} />
        <Row label="📈 Placements" value={formatEUR(r.placements)} />
        <Row label="🏠 Immobilier" value={formatEUR(r.immobilier)} />
        <Row label="💳 Dettes" value={formatEUR(r.dettes > 0 ? -r.dettes : 0)} tone={r.dettes > 0 ? 'negative' : 'default'} />
        <Divider />
        <Row label="Actifs totaux" value={formatEUR(r.actifsTotaux)} strong />
        <Row label="Patrimoine financier net (hors immo)" value={formatEUR(r.patrimoineFinancierNet)} tone="accent" />
      </Card>

      {SECTIONS.map((sec) => {
        const list = items.filter((i) => i.type === sec.type);
        const total = list.reduce((s, i) => s + i.montant, 0);
        return (
          <Card key={sec.type}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <SectionTitle>{`${sec.emoji} ${sec.title}`}</SectionTitle>
              <Text style={{ color: sec.type === 'dette' && total > 0 ? p.negative : p.textSecondary, fontWeight: '700', fontSize: 13 }}>
                {formatEUR(sec.type === 'dette' && total > 0 ? -total : total)}
              </Text>
            </View>
            {list.map((item) => (
              <ItemRow key={item.id} item={item} />
            ))}
            <Pressable onPress={() => add(sec.type)} style={{ paddingTop: spacing.xs }}>
              <Text style={{ color: p.accent, fontWeight: '700' }}>＋ Ajouter</Text>
            </Pressable>
          </Card>
        );
      })}

      <Subtitle>
        Pour l'immobilier, saisissez la valorisation comme actif et le capital restant dû comme dette
        séparée.
      </Subtitle>
      <View style={{ height: spacing.xl }} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  itemBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
});
