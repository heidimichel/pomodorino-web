import { useRef, useState, type ReactElement, type FormEvent } from 'react'
import { type PomodoroPhase, type PomodoroSettings } from './types'
import { SyncAdapter } from './syncAdapter'

export interface ClockProps {
  phase: PomodoroPhase
  formattedTime: string
  isRunning: boolean
  progress: number
  completedCount: number
  settings: PomodoroSettings
  onToggle: () => void
  onReset: () => void
  onSkip: () => void
  onSwitchPhase: (newPhase: PomodoroPhase) => void
  onUpdateSettings: (newSettings: PomodoroSettings) => void
}

const Clock = ({
  phase,
  formattedTime,
  isRunning,
  progress,
  completedCount,
  settings,
  onToggle,
  onReset,
  onSkip,
  onSwitchPhase,
  onUpdateSettings
}: ClockProps): ReactElement => {
  const dialogRef = useRef<HTMLDialogElement | null>(null)
  const [draftSettings, setDraftSettings] = useState<PomodoroSettings>(settings)
  const [testResult, setTestResult] = useState<{ ok?: boolean, message?: string } | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  // Circular progress calculations
  const radius = 110
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference * (1 - Math.max(0, Math.min(1, progress)))

  const openSettings = (): void => {
    setDraftSettings(settings)
    setTestResult(null)
    dialogRef.current?.showModal()
  }

  const closeSettings = (): void => {
    dialogRef.current?.close()
  }

  const handleSaveSettings = (e: FormEvent): void => {
    e.preventDefault()
    onUpdateSettings(draftSettings)
    closeSettings()
  }

  const handleTestConnection = async (): Promise<void> => {
    setIsTesting(true)
    setTestResult(null)
    const res = await SyncAdapter.testConnection(draftSettings.syncUrl, draftSettings.syncKey)
    setIsTesting(false)
    setTestResult(res)
  }

  return (
    <main className="pomo-container">
      {/* Header Landmark */}
      <header className="pomo-header">
        <div className="pomo-brand">
          <img src="/pomodorino.svg" alt="" width="36" height="36" className="pomo-logo" aria-hidden="true" />
          <div>
            <h1 className="pomo-title">Pomodorino Timer</h1>
            <p className="pomo-subtitle">
              {phase === 'focus' ? 'Stay focused & productive' : 'Rest and recharge'}
            </p>
          </div>
        </div>

        <div className="pomo-header-actions">
          {completedCount > 0 && (
            <div className="pomo-badge" title="Completed Focus Sessions">
              <span aria-hidden="true">🍅</span>
              <span>{completedCount}</span>
            </div>
          )}

          <button
            type="button"
            className="pomo-icon-btn"
            onClick={openSettings}
            aria-label="Open settings"
            title="Settings"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* Mode Switcher */}
      <nav className="pomo-modes" aria-label="Timer Modes">
        <button
          type="button"
          className={`pomo-mode-btn ${phase === 'focus' ? 'active' : ''}`}
          onClick={() => { onSwitchPhase('focus') }}
        >
          <span aria-hidden="true">🍅</span> Focus
        </button>
        <button
          type="button"
          className={`pomo-mode-btn ${phase === 'shortBreak' ? 'active' : ''}`}
          onClick={() => { onSwitchPhase('shortBreak') }}
        >
          <span aria-hidden="true">☕️</span> Short Break
        </button>
      </nav>

      {/* Timer Circular Ring */}
      <section className="pomo-timer-display" aria-label="Countdown Timer">
        <div className="pomo-ring-container">
          <svg className="pomo-ring-svg" viewBox="0 0 260 260" width="260" height="260">
            {/* Background track */}
            <circle
              className="pomo-ring-track"
              cx="130"
              cy="130"
              r={radius}
            />
            {/* Animated progress arc */}
            <circle
              className="pomo-ring-progress"
              cx="130"
              cy="130"
              r={radius}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <div className="pomo-ring-inner">
            <span className="pomo-phase-emoji" aria-hidden="true">
              {phase === 'focus' ? '🍅' : '☕️'}
            </span>
            <div className="pomo-digits" aria-live="polite">
              {formattedTime}
            </div>
            <div className="pomo-phase-label">
              {phase === 'focus' ? 'FOCUS TIME' : 'SHORT BREAK'}
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="pomo-controls" aria-label="Timer Controls">
        <button
          type="button"
          className="pomo-btn pomo-btn-primary"
          onClick={onToggle}
          aria-label={isRunning ? 'Pause timer' : 'Start timer'}
        >
          {isRunning ? 'Pause' : 'Start'}
        </button>

        <div className="pomo-sub-controls">
          <button
            type="button"
            className="pomo-btn pomo-btn-secondary"
            onClick={onReset}
            aria-label="Reset timer"
          >
            Reset
          </button>
          <button
            type="button"
            className="pomo-btn pomo-btn-secondary"
            onClick={onSkip}
            aria-label="Skip to next phase"
          >
            Skip
          </button>
        </div>
      </section>

      {/* Settings Dialog */}
      <dialog ref={dialogRef} className="pomo-dialog" aria-labelledby="settings-heading">
        <form onSubmit={handleSaveSettings} className="pomo-dialog-content">
          <div className="pomo-dialog-header">
            <h2 id="settings-heading">Settings</h2>
            <button
              type="button"
              className="pomo-dialog-close"
              onClick={closeSettings}
              aria-label="Close dialog"
            >
              ✕
            </button>
          </div>

          <fieldset className="pomo-fieldset">
            <legend>Session Durations</legend>
            <div className="pomo-field">
              <label htmlFor="focus-minutes">Focus Length (minutes):</label>
              <select
                id="focus-minutes"
                value={draftSettings.focusMinutes}
                onChange={(e) => {
                  setDraftSettings({ ...draftSettings, focusMinutes: Number(e.target.value) })
                }}
              >
                {[15, 20, 25, 30, 45, 50, 60].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>

            <div className="pomo-field">
              <label htmlFor="break-minutes">Break Length (minutes):</label>
              <select
                id="break-minutes"
                value={draftSettings.breakMinutes}
                onChange={(e) => {
                  setDraftSettings({ ...draftSettings, breakMinutes: Number(e.target.value) })
                }}
              >
                {[3, 5, 10, 15, 20].map((m) => (
                  <option key={m} value={m}>{m} minutes</option>
                ))}
              </select>
            </div>
          </fieldset>

          <fieldset className="pomo-fieldset">
            <legend>Audio Alert</legend>
            <div className="pomo-field-checkbox">
              <input
                type="checkbox"
                id="sound-enabled"
                checked={draftSettings.soundEnabled}
                onChange={(e) => {
                  setDraftSettings({ ...draftSettings, soundEnabled: e.target.checked })
                }}
              />
              <label htmlFor="sound-enabled">Play chime tone upon session completion</label>
            </div>
          </fieldset>

          <fieldset className="pomo-fieldset">
            <legend>Optional Plug-in Sync Backend (Go)</legend>
            <p className="pomo-field-desc">
              Connect to an optional Pomodorino Go server to sync session history across your devices.
            </p>
            <div className="pomo-field">
              <label htmlFor="sync-url">Sync Server URL:</label>
              <input
                type="url"
                id="sync-url"
                placeholder="http://localhost:8080 or https://..."
                value={draftSettings.syncUrl}
                onChange={(e) => {
                  setDraftSettings({ ...draftSettings, syncUrl: e.target.value })
                }}
              />
            </div>

            <div className="pomo-field">
              <label htmlFor="sync-key">Sync API Key / Token (optional):</label>
              <input
                type="password"
                id="sync-key"
                placeholder="Bearer token or room key"
                value={draftSettings.syncKey}
                onChange={(e) => {
                  setDraftSettings({ ...draftSettings, syncKey: e.target.value })
                }}
              />
            </div>

            {draftSettings.syncUrl.trim() !== '' && (
              <div className="pomo-test-row">
                <button
                  type="button"
                  className="pomo-btn-secondary pomo-btn-small"
                  onClick={() => { void handleTestConnection() }}
                  disabled={isTesting}
                >
                  {isTesting ? 'Testing...' : 'Test Connection'}
                </button>
                {testResult !== null && (
                  <span className={`pomo-test-badge ${testResult.ok === true ? 'success' : 'error'}`}>
                    {testResult.message ?? ''}
                  </span>
                )}
              </div>
            )}
          </fieldset>

          <footer className="pomo-dialog-footer">
            <button type="button" className="pomo-btn-secondary" onClick={closeSettings}>
              Cancel
            </button>
            <button type="submit" className="pomo-btn-primary">
              Save Changes
            </button>
          </footer>
        </form>
      </dialog>
    </main>
  )
}

export default Clock
