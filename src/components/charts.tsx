// ---------------------------------------------------------------------------
// Graphiques légers à base de Views (aucune dépendance externe).
// ---------------------------------------------------------------------------
import { Text, View } from 'react-native';

import { radius, spacing, usePalette } from '@/theme';

export interface BarDatum {
  label: string;
  value: number;
  color: string;
}

/**
 * Barres horizontales comparatives. Les longueurs sont proportionnelles à la
 * valeur absolue max ; les valeurs négatives s'affichent en rouge.
 */
export function ComparisonBars({
  data,
  format,
}: {
  data: BarDatum[];
  format: (v: number) => string;
}) {
  const p = usePalette();
  const maxAbs = Math.max(1, ...data.map((d) => Math.abs(d.value)));

  return (
    <View style={{ gap: spacing.sm }}>
      {data.map((d, i) => {
        const ratio = Math.abs(d.value) / maxAbs;
        const negative = d.value < 0;
        return (
          <View key={`${d.label}-${i}`} style={{ gap: 3 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={{ color: p.textSecondary, fontSize: 12.5, flex: 1 }} numberOfLines={1}>
                {d.label}
              </Text>
              <Text style={{ color: negative ? p.negative : p.text, fontSize: 12.5, fontWeight: '700' }}>
                {format(d.value)}
              </Text>
            </View>
            <View style={{ height: 10, borderRadius: 5, backgroundColor: p.inputBg, overflow: 'hidden' }}>
              <View
                style={{
                  width: `${Math.max(2, ratio * 100)}%`,
                  height: '100%',
                  borderRadius: 5,
                  backgroundColor: negative ? p.negative : d.color,
                }}
              />
            </View>
          </View>
        );
      })}
    </View>
  );
}

/** Barres empilées horizontales (répartition d'un total). */
export function StackedBar({
  segments,
  format,
}: {
  segments: { label: string; value: number; color: string }[];
  format: (v: number) => string;
}) {
  const p = usePalette();
  const total = Math.max(1, segments.reduce((s, x) => s + Math.max(0, x.value), 0));
  return (
    <View style={{ gap: spacing.sm }}>
      <View style={{ flexDirection: 'row', height: 16, borderRadius: 8, overflow: 'hidden', backgroundColor: p.inputBg }}>
        {segments.map((s, i) =>
          s.value > 0 ? (
            <View key={i} style={{ width: `${(s.value / total) * 100}%`, backgroundColor: s.color }} />
          ) : null,
        )}
      </View>
      <View style={{ gap: 4 }}>
        {segments.map((s, i) => (
          <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: s.color }} />
            <Text style={{ color: p.textSecondary, fontSize: 13, flex: 1 }}>{s.label}</Text>
            <Text style={{ color: p.text, fontSize: 13, fontWeight: '600' }}>{format(s.value)}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

/** Pastille de couleur + nom (légende de scénario). */
export function Legend({ items }: { items: { label: string; color: string }[] }) {
  const p = usePalette();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md }}>
      {items.map((it, i) => (
        <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: radius.sm, backgroundColor: it.color }} />
          <Text style={{ color: p.textSecondary, fontSize: 13, fontWeight: '600' }}>{it.label}</Text>
        </View>
      ))}
    </View>
  );
}
