import { type ReactElement, useEffect, useRef, useState } from 'react'
import Clock from './Clock'
import { playChime } from './audio'
import { SyncAdapter } from './syncAdapter'
import { type CompletedSession, type PomodoroPhase, type PomodoroSettings } from './types'
import './App.css'

const App = (): ReactElement => {
  const [settings, setSettings] = useState<PomodoroSettings>(() => SyncAdapter.loadSettings())
  const [phase, setPhase] = useState<PomodoroPhase>('focus')
  const [timeRemaining, setTimeRemaining] = useState<number>(() => settings.focusMinutes * 60)
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [completedCount, setCompletedCount] = useState<number>(() => {
    return SyncAdapter.loadSessions().filter(s => s.phase === 'focus').length
  })

  const targetEndTimeRef = useRef<number | null>(null)

  // Format mm:ss
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  const formattedTime = formatTime(timeRemaining)

  // Update browser tab title
  useEffect(() => {
    const icon = phase === 'focus' ? '🍅' : '☕️'
    document.title = isRunning
      ? `(${formattedTime}) ${icon} Pomodorino`
      : `${icon} Pomodorino Timer`
  }, [formattedTime, isRunning, phase])

  // Heartbeat loop with timestamp sync (eliminates background tab drift)
  useEffect(() => {
    if (!isRunning) {
      targetEndTimeRef.current = null
      return
    }

    if (targetEndTimeRef.current === null) {
      targetEndTimeRef.current = Date.now() + timeRemaining * 1000
    }

    const intervalId = setInterval(() => {
      if (targetEndTimeRef.current === null) return
      const remainingMs = targetEndTimeRef.current - Date.now()
      const remainingSecs = Math.max(0, Math.ceil(remainingMs / 1000))

      setTimeRemaining(remainingSecs)

      if (remainingSecs <= 0) {
        setIsRunning(false)
        targetEndTimeRef.current = null

        if (settings.soundEnabled) {
          playChime()
        }

        // Record completed session
        const sessionDuration = phase === 'focus' ? settings.focusMinutes : settings.breakMinutes
        const sessionRecord: CompletedSession = {
          id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
          phase,
          durationMinutes: sessionDuration,
          completedAt: new Date().toISOString()
        }
        void SyncAdapter.recordSession(sessionRecord, settings)

        // Advance to next phase
        if (phase === 'focus') {
          setCompletedCount((prev) => prev + 1)
          setPhase('shortBreak')
          setTimeRemaining(settings.breakMinutes * 60)
        } else {
          setPhase('focus')
          setTimeRemaining(settings.focusMinutes * 60)
        }
      }
    }, 250)

    return () => { clearInterval(intervalId) }
  }, [isRunning, phase, settings, timeRemaining])

  const handleToggle = (): void => {
    if (isRunning) {
      setIsRunning(false)
      targetEndTimeRef.current = null
    } else {
      targetEndTimeRef.current = Date.now() + timeRemaining * 1000
      setIsRunning(true)
    }
  }

  const handleReset = (): void => {
    setIsRunning(false)
    targetEndTimeRef.current = null
    const duration = phase === 'focus' ? settings.focusMinutes : settings.breakMinutes
    setTimeRemaining(duration * 60)
  }

  const handleSkip = (): void => {
    setIsRunning(false)
    targetEndTimeRef.current = null
    const nextPhase: PomodoroPhase = phase === 'focus' ? 'shortBreak' : 'focus'
    setPhase(nextPhase)
    const nextDuration = nextPhase === 'focus' ? settings.focusMinutes : settings.breakMinutes
    setTimeRemaining(nextDuration * 60)
  }

  const handleSwitchPhase = (newPhase: PomodoroPhase): void => {
    if (phase === newPhase) return
    setIsRunning(false)
    targetEndTimeRef.current = null
    setPhase(newPhase)
    const duration = newPhase === 'focus' ? settings.focusMinutes : settings.breakMinutes
    setTimeRemaining(duration * 60)
  }

  const handleUpdateSettings = (newSettings: PomodoroSettings): void => {
    setSettings(newSettings)
    SyncAdapter.saveSettings(newSettings)
    // If not currently running, apply new duration immediately
    if (!isRunning) {
      const duration = phase === 'focus' ? newSettings.focusMinutes : newSettings.breakMinutes
      setTimeRemaining(duration * 60)
    }
  }

  const totalDuration = (phase === 'focus' ? settings.focusMinutes : settings.breakMinutes) * 60
  const progress = totalDuration > 0 ? timeRemaining / totalDuration : 0

  return (
    <Clock
      phase={phase}
      formattedTime={formattedTime}
      isRunning={isRunning}
      progress={progress}
      completedCount={completedCount}
      settings={settings}
      onToggle={handleToggle}
      onReset={handleReset}
      onSkip={handleSkip}
      onSwitchPhase={handleSwitchPhase}
      onUpdateSettings={handleUpdateSettings}
    />
  )
}

export default App
