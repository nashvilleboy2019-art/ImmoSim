// ---------------------------------------------------------------------------
// État global (Zustand) avec persistance AsyncStorage.
// Gère plusieurs SCÉNARIOS de simulation comparables ; un scénario est actif et
// alimente tous les écrans. Les actions granulaires modifient le scénario actif.
// ---------------------------------------------------------------------------
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

import { blankState, defaultFoyer, defaultState } from '@/domain/defaults';
import type {
  BudgetLine,
  Foyer,
  LoanParams,
  PatrimoineItem,
  Personne,
  Property,
  RavParams,
  SimulationState,
  TaxParams,
} from '@/domain/types';

export const SCENARIO_COLORS = [
  '#2563EB',
  '#0E9F6E',
  '#C2700A',
  '#7C3AED',
  '#DB2777',
  '#0891B2',
] as const;

export interface Scenario {
  id: string;
  name: string;
  color: string;
  state: SimulationState;
}

interface StoreActions {
  // Mutations du scénario actif
  setLoan: (patch: Partial<LoanParams>) => void;
  setTax: (patch: Partial<TaxParams>) => void;
  setRav: (patch: Partial<RavParams>) => void;
  setFoyer: (patch: Partial<Foyer>) => void;
  updatePersonne: (index: number, patch: Partial<Personne>) => void;
  updateProperty: (id: string, patch: Partial<Property>) => void;
  addProperty: () => void;
  removeProperty: (id: string) => void;
  setProperties: (properties: Property[]) => void;
  updateBudgetLine: (id: string, patch: Partial<BudgetLine>) => void;
  addBudgetLine: (categorie: BudgetLine['categorie']) => void;
  removeBudgetLine: (id: string) => void;
  setBudget: (budget: BudgetLine[]) => void;
  updatePatrimoine: (id: string, patch: Partial<PatrimoineItem>) => void;
  addPatrimoine: (type: PatrimoineItem['type']) => void;
  removePatrimoine: (id: string) => void;
  appendPatrimoine: (items: PatrimoineItem[]) => void;
  setPatrimoine: (items: PatrimoineItem[]) => void;
  // Gestion des scénarios
  scenarios: Scenario[];
  activeId: string;
  addScenario: (name?: string) => void;
  /** Crée un scénario vierge (sans données d'exemple) et l'active. */
  addBlankScenario: (name?: string) => void;
  duplicateScenario: (id: string) => void;
  renameScenario: (id: string, name: string) => void;
  deleteScenario: (id: string) => void;
  setActive: (id: string) => void;
  // Onboarding
  onboardingDone: boolean;
  projectType: string | null;
  completeOnboarding: (projectType: string) => void;
  restartOnboarding: () => void;
  // Global
  resetAll: () => void;
  hydrated: boolean;
  setHydrated: () => void;
}

export type Store = StoreActions;

const newId = () => `${Date.now()}-${Math.round(Math.random() * 1e6)}`;

function makeScenario(name: string, index: number, state?: SimulationState): Scenario {
  return {
    id: newId(),
    name,
    color: SCENARIO_COLORS[index % SCENARIO_COLORS.length],
    state: state ?? defaultState(),
  };
}

/** Renvoie un patch modifiant l'état du scénario actif via `fn`. */
function mutateActive(s: Store, fn: (st: SimulationState) => SimulationState) {
  return {
    scenarios: s.scenarios.map((sc) =>
      sc.id === s.activeId ? { ...sc, state: fn(sc.state) } : sc,
    ),
  };
}

export function activeStateOf(s: Store): SimulationState {
  return s.scenarios.find((x) => x.id === s.activeId)?.state ?? defaultState();
}

/** Complète un état persisté potentiellement ancien avec les champs récents. */
function normalizeState(state: any): SimulationState {
  const base = defaultState();
  const foyer: Foyer =
    state?.foyer && Array.isArray(state.foyer.personnes)
      ? { ...state.foyer, surfaceM2: state.foyer.surfaceM2 ?? defaultFoyer.surfaceM2 }
      : { personnes: defaultFoyer.personnes.map((x) => ({ ...x })), surfaceM2: defaultFoyer.surfaceM2 };
  const ratt = state?.rav?.rattachementEnfant;
  const rattachementEnfant = ratt === 'A' || ratt === 'B' ? ratt : 'A';
  return {
    foyer,
    loan: { ...base.loan, ...(state?.loan ?? {}) },
    properties: state?.properties ?? base.properties,
    tax: { ...base.tax, ...(state?.tax ?? {}) },
    rav: { ...base.rav, ...(state?.rav ?? {}), rattachementEnfant },
    budget: state?.budget ?? base.budget,
    patrimoine: state?.patrimoine ?? base.patrimoine,
  };
}

function initialScenarios(): Pick<Store, 'scenarios' | 'activeId'> {
  const first = makeScenario('Scénario principal', 0);
  return { scenarios: [first], activeId: first.id };
}

export const useStore = create<Store>()(
  persist(
    (set, get) => ({
      ...initialScenarios(),
      hydrated: false,
      onboardingDone: false,
      projectType: null,
      setHydrated: () => set({ hydrated: true }),

      // --- Mutations scénario actif ---
      setLoan: (patch) => set((s) => mutateActive(s, (st) => ({ ...st, loan: { ...st.loan, ...patch } }))),
      setTax: (patch) => set((s) => mutateActive(s, (st) => ({ ...st, tax: { ...st.tax, ...patch } }))),
      setRav: (patch) => set((s) => mutateActive(s, (st) => ({ ...st, rav: { ...st.rav, ...patch } }))),
      setFoyer: (patch) =>
        set((s) => mutateActive(s, (st) => ({ ...st, foyer: { ...st.foyer, ...patch } }))),
      updatePersonne: (index, patch) =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            foyer: {
              ...st.foyer,
              personnes: st.foyer.personnes.map((per, i) => (i === index ? { ...per, ...patch } : per)),
            },
          })),
        ),

      updateProperty: (id, patch) =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            properties: st.properties.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          })),
        ),
      addProperty: () =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            properties: [
              ...st.properties,
              {
                id: newId(),
                nom: `Bien ${st.properties.length + 1}`,
                proprietaire: '',
                loyerMensuel: 0,
                chargesRecuperablesMensuelles: 0,
                mensualiteCreditActuel: 0,
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
                tmi: st.tax.tmiIR,
                regime: 'reelLMNP',
              },
            ],
          })),
        ),
      removeProperty: (id) =>
        set((s) => mutateActive(s, (st) => ({ ...st, properties: st.properties.filter((p) => p.id !== id) }))),
      setProperties: (properties) => set((s) => mutateActive(s, (st) => ({ ...st, properties }))),

      updateBudgetLine: (id, patch) =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            budget: st.budget.map((b) => (b.id === id ? { ...b, ...patch } : b)),
          })),
        ),
      addBudgetLine: (categorie) =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            budget: [
              ...st.budget,
              { id: newId(), categorie, poste: 'Nouveau poste', montantMensuel: 0, priorite: 'Confort', actif: true },
            ],
          })),
        ),
      removeBudgetLine: (id) =>
        set((s) => mutateActive(s, (st) => ({ ...st, budget: st.budget.filter((b) => b.id !== id) }))),
      setBudget: (budget) => set((s) => mutateActive(s, (st) => ({ ...st, budget }))),

      updatePatrimoine: (id, patch) =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            patrimoine: st.patrimoine.map((p) => (p.id === id ? { ...p, ...patch } : p)),
          })),
        ),
      addPatrimoine: (type) =>
        set((s) =>
          mutateActive(s, (st) => ({
            ...st,
            patrimoine: [...st.patrimoine, { id: newId(), type, libelle: 'Nouvel élément', montant: 0 }],
          })),
        ),
      removePatrimoine: (id) =>
        set((s) => mutateActive(s, (st) => ({ ...st, patrimoine: st.patrimoine.filter((p) => p.id !== id) }))),
      appendPatrimoine: (items) =>
        set((s) => mutateActive(s, (st) => ({ ...st, patrimoine: [...st.patrimoine, ...items] }))),
      setPatrimoine: (items) => set((s) => mutateActive(s, (st) => ({ ...st, patrimoine: items }))),

      // --- Gestion des scénarios ---
      addScenario: (name) =>
        set((s) => {
          const sc = makeScenario(name || `Scénario ${s.scenarios.length + 1}`, s.scenarios.length);
          return { scenarios: [...s.scenarios, sc], activeId: sc.id };
        }),
      addBlankScenario: (name) =>
        set((s) => {
          const sc = makeScenario(name || `Scénario ${s.scenarios.length + 1}`, s.scenarios.length, blankState());
          return { scenarios: [...s.scenarios, sc], activeId: sc.id };
        }),
      duplicateScenario: (id) =>
        set((s) => {
          const src = s.scenarios.find((x) => x.id === id);
          if (!src) return {};
          const copy = makeScenario(`${src.name} (copie)`, s.scenarios.length, JSON.parse(JSON.stringify(src.state)));
          return { scenarios: [...s.scenarios, copy], activeId: copy.id };
        }),
      renameScenario: (id, name) =>
        set((s) => ({ scenarios: s.scenarios.map((x) => (x.id === id ? { ...x, name } : x)) })),
      deleteScenario: (id) =>
        set((s) => {
          if (s.scenarios.length <= 1) return {};
          const scenarios = s.scenarios.filter((x) => x.id !== id);
          const activeId = s.activeId === id ? scenarios[0].id : s.activeId;
          return { scenarios, activeId };
        }),
      setActive: (id) => set({ activeId: id }),

      // --- Onboarding ---
      completeOnboarding: (projectType) => set({ onboardingDone: true, projectType }),
      restartOnboarding: () => set({ onboardingDone: false }),

      // --- Global ---
      resetAll: () => set({ ...initialScenarios(), onboardingDone: false, projectType: null }),
    }),
    {
      name: 'immosim-state-v1',
      version: 6,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => ({
        scenarios: s.scenarios,
        activeId: s.activeId,
        onboardingDone: s.onboardingDone,
        projectType: s.projectType,
      }),
      migrate: (persisted: any, version: number) => {
        let p = persisted;
        // v1 : état unique au niveau racine -> on l'enveloppe dans un scénario.
        if (version < 2 && p && p.loan) {
          const first = makeScenario('Scénario principal', 0, normalizeState(p));
          p = {
            scenarios: [first],
            activeId: first.id,
            onboardingDone: p.onboardingDone ?? false,
            projectType: p.projectType ?? null,
          };
        }
        // v3 : chaque scénario doit avoir un foyer + un rattachement indexé.
        if (p && Array.isArray(p.scenarios)) {
          p = { ...p, scenarios: p.scenarios.map((sc: any) => ({ ...sc, state: normalizeState(sc.state) })) };
        }
        return p;
      },
      onRehydrateStorage: () => (state) => state?.setHydrated(),
    },
  ),
);

// ---------- Hooks sélecteurs sur le scénario actif ----------
export const useLoan = () => useStore((s) => activeStateOf(s).loan);
export const useProperties = () => useStore((s) => activeStateOf(s).properties);
export const useTax = () => useStore((s) => activeStateOf(s).tax);
export const useRav = () => useStore((s) => activeStateOf(s).rav);
export const useFoyer = () => useStore((s) => activeStateOf(s).foyer);
export const useBudget = () => useStore((s) => activeStateOf(s).budget);
export const usePatrimoineItems = () => useStore((s) => activeStateOf(s).patrimoine);
