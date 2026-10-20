export type PomodoroPhase = 'focus' | 'shortBreak'

export interface PomodoroSettings {
  focusMinutes: number
  breakMinutes: number
  soundEnabled: boolean
  syncUrl: string
  syncKey: string
}

export interface CompletedSession {
  id: string
  phase: PomodoroPhase
  durationMinutes: number
  completedAt: string
}

export type SyncStatus = 'standalone' | 'connecting' | 'connected' | 'error'

export const DEFAULT_SETTINGS: PomodoroSettings = {
  focusMinutes: 25,
  breakMinutes: 5,
  soundEnabled: true,
  syncUrl: '',
  syncKey: ''
}
