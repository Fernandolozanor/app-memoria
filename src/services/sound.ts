import { addMistake } from './sessionStats'

// Sound effects engine using Web Audio API
// Generates gentle, warm, harmonic tones suitable for seniors (no harsh buzzers or shrill beeps)

class SoundService {
  private ctx: AudioContext | null = null
  private activeMelodyNodes: OscillatorNode[] = []

  constructor() {
    if (typeof window !== 'undefined') {
      const unlock = () => {
        this.getContext()
      }
      window.addEventListener('pointerdown', unlock, { passive: true })
      window.addEventListener('touchstart', unlock, { passive: true })
      window.addEventListener('click', unlock, { passive: true })
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      if (AudioCtx) {
        this.ctx = new AudioCtx()
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {})
    }
    return this.ctx
  }

  // Soft click / tap
  playTap() {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(440, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(220, ctx.currentTime + 0.08)

    gain.gain.setValueAtTime(0.12, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.09)
  }

  // Harmonic chord for correct answer (C Major: C5 - E5 - G5)
  playSuccess() {
    const ctx = this.getContext()
    if (!ctx) return

    const notes = [523.25, 659.25, 783.99] // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle' // warmer than sine, softer than square
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.06)

      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.06)
      gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + idx * 0.06 + 0.03)
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.06 + 0.5)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(ctx.currentTime + idx * 0.06)
      osc.stop(ctx.currentTime + idx * 0.06 + 0.55)
    })
  }

  // Cheerful, fun victory jingle for game completion (bouncy marimba melody with triumphant final chord)
  playVictoryJingle() {
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // Cheerful, buoyant melody in C Major: "Da-da-da DAAA! ... da-da-da DAAA! ... ti-ri-ti-ri-TA-CHÁN!"
    const melody: { freq: number; time: number; dur: number; vol: number }[] = [
      // Phrase 1: Bouncy ascending arpeggio
      { freq: 523.25, time: 0.0, dur: 0.12, vol: 0.16 }, // C5
      { freq: 659.25, time: 0.13, dur: 0.12, vol: 0.16 }, // E5
      { freq: 783.99, time: 0.26, dur: 0.13, vol: 0.18 }, // G5
      { freq: 1046.5, time: 0.4, dur: 0.26, vol: 0.22 }, // C6!

      // Phrase 2: Joyful syncopated walk
      { freq: 880.0, time: 0.7, dur: 0.12, vol: 0.16 }, // A5
      { freq: 987.77, time: 0.83, dur: 0.12, vol: 0.17 }, // B5
      { freq: 1046.5, time: 0.96, dur: 0.12, vol: 0.18 }, // C6
      { freq: 1174.66, time: 1.09, dur: 0.25, vol: 0.22 }, // D6!

      // Phrase 3: Playful sparkle flourish
      { freq: 1046.5, time: 1.38, dur: 0.1, vol: 0.17 }, // C6
      { freq: 1174.66, time: 1.49, dur: 0.1, vol: 0.18 }, // D6
      { freq: 1318.51, time: 1.6, dur: 0.11, vol: 0.2 }, // E6
      { freq: 1174.66, time: 1.72, dur: 0.11, vol: 0.18 }, // D6
      { freq: 1046.5, time: 1.84, dur: 0.15, vol: 0.2 }, // C6

      // Grand celebratory finale chord: C6 + E6 + G6 + C5
      { freq: 523.25, time: 2.05, dur: 0.55, vol: 0.22 }, // C5
      { freq: 783.99, time: 2.05, dur: 0.55, vol: 0.22 }, // G5
      { freq: 1046.5, time: 2.05, dur: 0.55, vol: 0.24 }, // C6
      { freq: 1318.51, time: 2.05, dur: 0.55, vol: 0.2 }, // E6
    ]

    // Warm marimba bass foundation for rhythm and punch
    const bass: { freq: number; time: number; dur: number }[] = [
      { freq: 130.81, time: 0.0, dur: 0.25 }, // C3
      { freq: 196.0, time: 0.4, dur: 0.25 }, // G3
      { freq: 174.61, time: 0.7, dur: 0.25 }, // F3
      { freq: 196.0, time: 1.09, dur: 0.25 }, // G3
      { freq: 130.81, time: 2.05, dur: 0.6 }, // C3 (root)
    ]

    // Play melody notes with dual-layer (triangle woody attack + warm sine shimmer)
    melody.forEach((note) => {
      const start = now + note.time
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle' // Marimba/xylophone character
      osc.frequency.setValueAtTime(note.freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(note.vol, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + note.dur + 0.05)
    })

    // Play acoustic bass notes
    bass.forEach((note) => {
      const start = now + note.time
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'sine'
      osc.frequency.setValueAtTime(note.freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(0.16, start + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, start + note.dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + note.dur + 0.05)
    })
  }

  // Alias for backward compatibility
  playFanfare() {
    this.playVictoryJingle()
  }

  // Individual musical note (for Piano activity)
  playNote(frequency: number, duration = 0.5) {
    const ctx = this.getContext()
    if (!ctx) return

    const osc = ctx.createOscillator()
    const gain = ctx.createGain()

    osc.type = 'triangle'
    osc.frequency.setValueAtTime(frequency, ctx.currentTime)

    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration)

    osc.connect(gain)
    gain.connect(ctx.destination)

    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + duration + 0.05)
  }

  // Real telephone DTMF (Dual-Tone Multi-Frequency) keypad sound for digits 0-9
  playPhoneDtmf(digit: number, duration = 0.18) {
    const ctx = this.getContext()
    if (!ctx) return

    // Official ITU-T DTMF frequency pairs [lowHz, highHz]
    const dtmfPairs: Record<number, [number, number]> = {
      1: [697, 1209],
      2: [697, 1336],
      3: [697, 1477],
      4: [770, 1209],
      5: [770, 1336],
      6: [770, 1477],
      7: [852, 1209],
      8: [852, 1336],
      9: [852, 1477],
      0: [941, 1336],
    }

    const [lowFreq, highFreq] = dtmfPairs[digit] || [697, 1209]
    const now = ctx.currentTime

    const oscLow = ctx.createOscillator()
    const oscHigh = ctx.createOscillator()
    const masterGain = ctx.createGain()

    oscLow.type = 'sine'
    oscHigh.type = 'sine'
    oscLow.frequency.setValueAtTime(lowFreq, now)
    oscHigh.frequency.setValueAtTime(highFreq, now)

    masterGain.gain.setValueAtTime(0.001, now)
    masterGain.gain.linearRampToValueAtTime(0.22, now + 0.01)
    masterGain.gain.setValueAtTime(0.22, now + duration - 0.02)
    masterGain.gain.exponentialRampToValueAtTime(0.001, now + duration)

    oscLow.connect(masterGain)
    oscHigh.connect(masterGain)
    masterGain.connect(ctx.destination)

    oscLow.start(now)
    oscHigh.start(now)
    oscLow.stop(now + duration + 0.02)
    oscHigh.stop(now + duration + 0.02)
  }

  stopMelody() {
    this.activeMelodyNodes.forEach((osc) => {
      try {
        osc.stop()
        osc.disconnect()
      } catch {
        // already stopped
      }
    })
    this.activeMelodyNodes = []
  }

  // Plays a scheduled sequence of notes (freq in Hz, dur in seconds) with warm accordion/piano timbre
  // Returns total duration in milliseconds
  playMelody(notes: { freq: number; dur: number; gap?: number }[]): number {
    const ctx = this.getContext()
    if (!ctx || notes.length === 0) return 0

    this.stopMelody()

    const now = ctx.currentTime + 0.04
    let cursor = 0

    notes.forEach((n) => {
      const start = now + cursor
      const gapSec = n.gap ?? 0.04 // distinct articulation gap between notes
      const soundDur = Math.max(0.08, n.dur - gapSec)

      if (n.freq > 0) {
        const osc1 = ctx.createOscillator()
        const osc2 = ctx.createOscillator()
        const gain = ctx.createGain()
        const gain2 = ctx.createGain()

        osc1.type = 'triangle'
        osc1.frequency.setValueAtTime(n.freq, start)

        osc2.type = 'sine'
        osc2.frequency.setValueAtTime(n.freq * 2, start)
        gain2.gain.setValueAtTime(0.08, start)

        gain.gain.setValueAtTime(0.001, start)
        gain.gain.linearRampToValueAtTime(0.32, start + 0.018)
        gain.gain.setValueAtTime(0.28, start + soundDur * 0.65)
        gain.gain.exponentialRampToValueAtTime(0.001, start + soundDur)

        osc1.connect(gain)
        osc2.connect(gain2)
        gain2.connect(gain)
        gain.connect(ctx.destination)

        osc1.start(start)
        osc2.start(start)
        osc1.stop(start + soundDur + 0.01)
        osc2.stop(start + soundDur + 0.01)

        this.activeMelodyNodes.push(osc1, osc2)
      }

      cursor += n.dur
    })

    return Math.round(cursor * 1000)
  }

  // Playful, funny mini-jingle when making a mistake (approx 0.65s: comical cartoon 'oops' slide, never punishing)
  playGentleRetry() {
    // Every gentle retry sound corresponds to a player mistake: track it for the final celebration
    addMistake()
    const ctx = this.getContext()
    if (!ctx) return

    const now = ctx.currentTime

    // 3 bouncy, comical descending steps (A4 -> G#4 -> G4)
    const steps = [
      { freq: 440.0, time: 0.0, dur: 0.1, vol: 0.14 }, // A4
      { freq: 415.3, time: 0.12, dur: 0.1, vol: 0.14 }, // G#4
      { freq: 392.0, time: 0.24, dur: 0.1, vol: 0.14 }, // G4
    ]

    steps.forEach((n) => {
      const start = now + n.time
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(n.freq, start)

      gain.gain.setValueAtTime(0.001, start)
      gain.gain.linearRampToValueAtTime(n.vol, start + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.001, start + n.dur)

      osc.connect(gain)
      gain.connect(ctx.destination)

      osc.start(start)
      osc.stop(start + n.dur + 0.05)
    })

    // Final comical note: funny downward slide (F4 down to D4 "wah-waaah")
    const finalStart = now + 0.36
    const finalDur = 0.28
    const oscFinal = ctx.createOscillator()
    const gainFinal = ctx.createGain()

    oscFinal.type = 'triangle'
    oscFinal.frequency.setValueAtTime(349.23, finalStart) // F4
    oscFinal.frequency.exponentialRampToValueAtTime(293.66, finalStart + finalDur) // Slides down to D4

    gainFinal.gain.setValueAtTime(0.001, finalStart)
    gainFinal.gain.linearRampToValueAtTime(0.16, finalStart + 0.02)
    gainFinal.gain.exponentialRampToValueAtTime(0.001, finalStart + finalDur)

    oscFinal.connect(gainFinal)
    gainFinal.connect(ctx.destination)

    oscFinal.start(finalStart)
    oscFinal.stop(finalStart + finalDur + 0.05)
  }
}

export const sound = new SoundService()
