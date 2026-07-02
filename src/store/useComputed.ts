// Hook : calcule la simulation du scénario actif (et utilitaires de comparaison).
import { useMemo } from 'react';

import { computeAll, type ComputedSimulation } from '@/domain';
import type { SimulationState } from '@/domain/types';
import { activeStateOf, useStore, type Scenario } from './useStore';

export function useComputed(): ComputedSimulation {
  const state = useStore((s) => activeStateOf(s));
  return useMemo(() => computeAll(state), [state]);
}

export interface ScenarioComputed {
  scenario: Scenario;
  computed: ComputedSimulation;
}

/** Calcule tous les scénarios (pour l'écran de comparaison). */
export function useAllComputed(): ScenarioComputed[] {
  const scenarios = useStore((s) => s.scenarios);
  return useMemo(
    () => scenarios.map((scenario) => ({ scenario, computed: computeAll(scenario.state) })),
    [scenarios],
  );
}

export function computeState(state: SimulationState): ComputedSimulation {
  return computeAll(state);
}
