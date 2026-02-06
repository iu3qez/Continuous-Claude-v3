import { create } from 'zustand'
import type { PillarHealth, HealthResponse } from '@/types'

interface HealthState {
  pillars: Record<string, PillarHealth>
  isLoading: boolean
  error: string | null
  lastUpdated: Date | null

  setHealth: (response: HealthResponse) => void
  updatePillar: (name: string, health: PillarHealth) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useHealthStore = create<HealthState>((set) => ({
  pillars: {},
  isLoading: true,
  error: null,
  lastUpdated: null,

  setHealth: (response) =>
    set({
      pillars: response.pillars,
      lastUpdated: new Date(),
      isLoading: false,
      error: null,
    }),

  updatePillar: (name, health) =>
    set((state) => ({
      pillars: { ...state.pillars, [name]: health },
      lastUpdated: new Date(),
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error, isLoading: false }),
}))
