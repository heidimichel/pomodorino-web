import { type CompletedSession, DEFAULT_SETTINGS, type PomodoroSettings } from './types'

const SETTINGS_KEY = 'pomodorino_settings'
const SESSIONS_KEY = 'pomodorino_sessions'

export const SyncAdapter = {
  loadSettings (): PomodoroSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY)
      if (raw === null || raw.trim() === '') return DEFAULT_SETTINGS
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
    } catch {
      return DEFAULT_SETTINGS
    }
  },

  saveSettings (settings: PomodoroSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    } catch (e) {
      console.warn('Failed to save settings to localStorage', e)
    }
  },

  loadSessions (): CompletedSession[] {
    try {
      const raw = localStorage.getItem(SESSIONS_KEY)
      if (raw === null || raw.trim() === '') return []
      return JSON.parse(raw)
    } catch {
      return []
    }
  },

  async recordSession (session: CompletedSession, settings: PomodoroSettings): Promise<void> {
    // 1. Always persist locally (offline-first)
    const sessions = this.loadSessions()
    sessions.unshift(session)
    // Keep last 100 sessions locally
    const trimmed = sessions.slice(0, 100)
    try {
      localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed))
    } catch (e) {
      console.warn('Failed to save session to localStorage', e)
    }

    // 2. Optional Go backend sync if configured
    if (settings.syncUrl.trim() !== '') {
      try {
        const url = settings.syncUrl.replace(/\/+$/, '')
        const headers: Record<string, string> = { 'Content-Type': 'application/json' }
        if (settings.syncKey.trim() !== '') {
          headers.Authorization = `Bearer ${settings.syncKey}`
        }
        await fetch(`${url}/api/v1/sessions`, {
          method: 'POST',
          headers,
          body: JSON.stringify(session)
        })
      } catch (err) {
        console.warn('Optional backend sync deferred (offline or unreachable):', err)
      }
    }
  },

  async testConnection (url: string, key?: string): Promise<{ ok: boolean, message: string }> {
    const cleanUrl = url.trim().replace(/\/+$/, '')
    if (cleanUrl === '') {
      return { ok: false, message: 'Please enter a valid server URL' }
    }

    try {
      const headers: Record<string, string> = {}
      if (typeof key === 'string' && key.trim() !== '') {
        headers.Authorization = `Bearer ${key.trim()}`
      }
      const res = await fetch(`${cleanUrl}/healthz`, { headers })
      if (!res.ok) {
        return { ok: false, message: `Server responded with status ${res.status}` }
      }
      const data = (await res.json()) as { message?: string }
      const msg = typeof data.message === 'string' && data.message.trim() !== ''
        ? data.message
        : 'Connected successfully to Pomodorino Sync Server!'
      return { ok: true, message: msg }
    } catch (err) {
      return { ok: false, message: `Connection failed: ${err instanceof Error ? err.message : 'Network error'}` }
    }
  }
}
