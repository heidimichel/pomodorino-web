// Synthesized chime using Web Audio API for lightweight, offline-ready sound alerts
export const playChime = (): void => {
  try {
    const AudioContextClass = window.AudioContext
    if (typeof AudioContextClass === 'undefined') return

    const ctx = new AudioContextClass()
    const now = ctx.currentTime

    // Two-tone completion bell (E5 -> G#5)
    const playTone = (freq: number, start: number, duration: number): void => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.exponentialRampToValueAtTime(0.3, start + 0.05)
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + duration)
    }

    playTone(659.25, now, 0.4) // E5
    playTone(830.61, now + 0.25, 0.8) // G#5
  } catch (err) {
    console.warn('Audio playback not permitted or unavailable:', err)
  }
}
