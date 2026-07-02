// ---------------------------------------------------------------------------
// Bibliothèque de composants UI réutilisables.
// ---------------------------------------------------------------------------
import { ReactNode, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { radius, spacing, usePalette, type Palette } from '@/theme';

// ---------- Screen ----------
export function Screen({
  children,
  scrollRef,
}: {
  children: ReactNode;
  scrollRef?: React.RefObject<ScrollView | null>;
}) {
  const p = usePalette();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: p.bg }} edges={['bottom']}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ padding: spacing.lg, paddingBottom: spacing.xxl * 2, gap: spacing.lg }}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

// ---------- Text helpers ----------
export function Title({ children }: { children: ReactNode }) {
  const p = usePalette();
  return <Text style={[styles.title, { color: p.text }]}>{children}</Text>;
}

export function Subtitle({ children }: { children: ReactNode }) {
  const p = usePalette();
  return <Text style={[styles.subtitle, { color: p.textSecondary }]}>{children}</Text>;
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const p = usePalette();
  return <Text style={[styles.sectionTitle, { color: p.textMuted }]}>{children}</Text>;
}

// ---------- Card ----------
export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  const p = usePalette();
  return (
    <View style={[styles.card, { backgroundColor: p.card, borderColor: p.border }, style]}>
      {children}
    </View>
  );
}

// ---------- Result row (label / value) ----------
export function Row({
  label,
  value,
  tone = 'default',
  strong,
  hint,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative' | 'accent';
  strong?: boolean;
  hint?: string;
}) {
  const p = usePalette();
  const color =
    tone === 'positive'
      ? p.positive
      : tone === 'negative'
        ? p.negative
        : tone === 'accent'
          ? p.accent
          : p.text;
  return (
    <View style={styles.row}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={[styles.rowLabel, { color: p.textSecondary, fontWeight: strong ? '700' : '500' }]}>
          {label}
        </Text>
        {hint ? <Text style={[styles.hint, { color: p.textMuted }]}>{hint}</Text> : null}
      </View>
      <Text style={[styles.rowValue, { color, fontWeight: strong ? '800' : '600' }]}>{value}</Text>
    </View>
  );
}

export function Divider() {
  const p = usePalette();
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: p.border, marginVertical: spacing.xs }} />;
}

// ---------- Number field ----------
export function NumberField({
  label,
  value,
  onChange,
  suffix,
  hint,
  step,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  suffix?: string;
  hint?: string;
  step?: number;
}) {
  const p = usePalette();
  const [text, setText] = useState<string | null>(null);
  const display = text ?? (value === 0 ? '' : String(value));
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[styles.fieldLabel, { color: p.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: p.inputBg, borderColor: p.border }]}>
        <TextInput
          style={[styles.input, { color: p.text }]}
          value={display}
          placeholder="0"
          placeholderTextColor={p.textMuted}
          keyboardType="numeric"
          inputMode="decimal"
          onFocus={() => setText(value === 0 ? '' : String(value))}
          onChangeText={(t) => {
            setText(t);
            const norm = t.replace(/\s/g, '').replace(',', '.');
            const n = parseFloat(norm);
            if (!isNaN(n)) onChange(n);
            else if (norm === '' || norm === '-') onChange(0);
          }}
          onBlur={() => setText(null)}
        />
        {suffix ? <Text style={[styles.suffix, { color: p.textMuted }]}>{suffix}</Text> : null}
      </View>
      {hint ? <Text style={[styles.hint, { color: p.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

/** Champ pour saisir un pourcentage (stocké en fraction, affiché en %). */
export function PercentField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  hint?: string;
}) {
  return (
    <NumberField
      label={label}
      value={Math.round(value * 1000) / 10}
      onChange={(v) => onChange(v / 100)}
      suffix="%"
      hint={hint}
    />
  );
}

// ---------- Text field ----------
export function TextField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const p = usePalette();
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[styles.fieldLabel, { color: p.textSecondary }]}>{label}</Text> : null}
      <View style={[styles.inputWrap, { backgroundColor: p.inputBg, borderColor: p.border }]}>
        <TextInput
          style={[styles.input, { color: p.text }]}
          value={value}
          placeholderTextColor={p.textMuted}
          onChangeText={onChange}
        />
      </View>
    </View>
  );
}

// ---------- Toggle ----------
export function ToggleField({
  label,
  value,
  onChange,
  hint,
}: {
  label: string;
  value: boolean;
  onChange: (v: boolean) => void;
  hint?: string;
}) {
  const p = usePalette();
  return (
    <View style={[styles.row, { alignItems: 'center' }]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={[styles.fieldLabel, { color: p.textSecondary }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: p.textMuted }]}>{hint}</Text> : null}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: p.accent, false: p.border }}
        thumbColor="#fff"
      />
    </View>
  );
}

// ---------- Segmented control ----------
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
}) {
  const p = usePalette();
  return (
    <View style={[styles.segment, { backgroundColor: p.inputBg, borderColor: p.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, active && { backgroundColor: p.accent }]}>
            <Text
              style={{
                color: active ? '#fff' : p.textSecondary,
                fontWeight: active ? '700' : '500',
                fontSize: 13,
                textAlign: 'center',
              }}>
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

// ---------- Chip select (choix multiple façon "pilules", idéal > 3 options) ----------
export function ChipSelect<T extends string>({
  label,
  options,
  value,
  onChange,
  hint,
}: {
  label?: string;
  options: { value: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  hint?: string;
}) {
  const p = usePalette();
  return (
    <View style={{ gap: spacing.xs }}>
      {label ? <Text style={[styles.fieldLabel, { color: p.textSecondary }]}>{label}</Text> : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              style={({ pressed }) => [
                styles.selectChip,
                {
                  backgroundColor: active ? p.accent : p.inputBg,
                  borderColor: active ? p.accent : p.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Text style={{ color: active ? '#fff' : p.textSecondary, fontWeight: active ? '700' : '500', fontSize: 13 }}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={[styles.hint, { color: p.textMuted }]}>{hint}</Text> : null}
    </View>
  );
}

// ---------- Pill / Badge ----------
export function Badge({
  text,
  tone = 'accent',
}: {
  text: string;
  tone?: 'accent' | 'positive' | 'negative' | 'warning';
}) {
  const p = usePalette();
  const map = {
    accent: [p.accentSoft, p.accent],
    positive: [p.positiveSoft, p.positive],
    negative: [p.negativeSoft, p.negative],
    warning: [p.warningSoft, p.warning],
  } as const;
  const [bg, fg] = map[tone];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={{ color: fg, fontWeight: '700', fontSize: 12 }}>{text}</Text>
    </View>
  );
}

// ---------- Button ----------
export function Button({
  title,
  onPress,
  tone = 'accent',
  variant = 'solid',
}: {
  title: string;
  onPress: () => void;
  tone?: 'accent' | 'negative';
  variant?: 'solid' | 'ghost';
}) {
  const p = usePalette();
  const color = tone === 'negative' ? p.negative : p.accent;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        variant === 'solid'
          ? { backgroundColor: color, opacity: pressed ? 0.85 : 1 }
          : { borderWidth: 1, borderColor: color, opacity: pressed ? 0.6 : 1 },
      ]}>
      <Text style={{ color: variant === 'solid' ? '#fff' : color, fontWeight: '700' }}>{title}</Text>
    </Pressable>
  );
}

// ---------- Big stat ----------
export function BigStat({
  label,
  value,
  tone = 'default',
  caption,
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'negative';
  caption?: string;
}) {
  const p = usePalette();
  const color = tone === 'positive' ? p.positive : tone === 'negative' ? p.negative : p.text;
  return (
    <View style={{ gap: 2 }}>
      <Text style={[styles.fieldLabel, { color: p.textSecondary }]}>{label}</Text>
      <Text style={[styles.bigStat, { color }]}>{value}</Text>
      {caption ? <Text style={[styles.hint, { color: p.textMuted }]}>{caption}</Text> : null}
    </View>
  );
}

// ---------- Stepper (− valeur +) ----------
export function Stepper({
  label,
  value,
  onChange,
  min = 0,
  max = 12,
  hint,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  hint?: string;
}) {
  const p = usePalette();
  const btn = (txt: string, on: () => void, disabled: boolean) => (
    <Pressable
      onPress={on}
      disabled={disabled}
      style={[styles.stepBtn, { backgroundColor: p.inputBg, borderColor: p.border, opacity: disabled ? 0.4 : 1 }]}>
      <Text style={{ color: p.text, fontSize: 20, fontWeight: '700' }}>{txt}</Text>
    </Pressable>
  );
  return (
    <View style={[styles.row, { alignItems: 'center' }]}>
      <View style={{ flex: 1, paddingRight: spacing.md }}>
        <Text style={[styles.fieldLabel, { color: p.textSecondary }]}>{label}</Text>
        {hint ? <Text style={[styles.hint, { color: p.textMuted }]}>{hint}</Text> : null}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.md }}>
        {btn('−', () => onChange(Math.max(min, value - 1)), value <= min)}
        <Text style={{ color: p.text, fontSize: 18, fontWeight: '800', minWidth: 24, textAlign: 'center' }}>{value}</Text>
        {btn('+', () => onChange(Math.min(max, value + 1)), value >= max)}
      </View>
    </View>
  );
}

// ---------- Choice card (sélection dans le parcours) ----------
export function ChoiceCard({
  emoji,
  title,
  description,
  selected,
  onPress,
}: {
  emoji?: string;
  title: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const p = usePalette();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.choice,
        {
          backgroundColor: selected ? p.accentSoft : p.card,
          borderColor: selected ? p.accent : p.border,
          borderWidth: selected ? 2 : StyleSheet.hairlineWidth,
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {emoji ? <Text style={{ fontSize: 26 }}>{emoji}</Text> : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: p.text, fontSize: 16, fontWeight: '700' }}>{title}</Text>
        {description ? (
          <Text style={{ color: p.textSecondary, fontSize: 13, marginTop: 2, lineHeight: 18 }}>
            {description}
          </Text>
        ) : null}
      </View>
      <View
        style={[
          styles.radio,
          { borderColor: selected ? p.accent : p.border, backgroundColor: selected ? p.accent : 'transparent' },
        ]}>
        {selected ? <Text style={{ color: '#fff', fontWeight: '900', fontSize: 12 }}>✓</Text> : null}
      </View>
    </Pressable>
  );
}

// ---------- Progress bar ----------
export function ProgressBar({ value }: { value: number }) {
  const p = usePalette();
  return (
    <View style={{ height: 6, borderRadius: 3, backgroundColor: p.inputBg, overflow: 'hidden' }}>
      <View style={{ width: `${Math.max(0, Math.min(1, value)) * 100}%`, height: '100%', backgroundColor: p.accent }} />
    </View>
  );
}

export function makeStyles(_p: Palette) {
  return styles;
}

const styles = StyleSheet.create({
  title: { fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  subtitle: { fontSize: 14, lineHeight: 20 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  card: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.lg,
    gap: spacing.md,
  },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  rowLabel: { fontSize: 14, lineHeight: 19 },
  rowValue: { fontSize: 15, textAlign: 'right' },
  hint: { fontSize: 12, lineHeight: 16, marginTop: 2 },
  fieldLabel: { fontSize: 14, fontWeight: '600' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.md,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 12, fontWeight: '600' },
  suffix: { fontSize: 14, fontWeight: '600', marginLeft: spacing.sm },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    padding: 3,
    gap: 3,
  },
  segmentItem: { flex: 1, paddingVertical: 9, paddingHorizontal: 6, borderRadius: radius.sm },
  selectChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: 5,
    borderRadius: radius.pill,
  },
  button: {
    paddingVertical: 13,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigStat: { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  choice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
