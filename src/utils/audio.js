const AUDIO_ASSETS = {
  correct: '/sounds/correct.mp3',
  wrong: '/sounds/wrong.mp3',
  streak: '/sounds/streak.mp3'
}

let audioContext

export function playSound(name) {
  const asset = AUDIO_ASSETS[name]
  if (!asset) return

  const audio = new Audio(asset)
  audio.volume = name === 'wrong' ? 0.18 : 0.3
  audio.play().catch(() => playSynthesizedSound(name))
}

function playSynthesizedSound(name) {
  try {
    audioContext ||= new AudioContext()
    const now = audioContext.currentTime
    const notes = name === 'correct' ? [523.25, 659.25] : name === 'streak' ? [523.25, 659.25, 783.99] : [180]
    notes.forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator()
      const gain = audioContext.createGain()
      oscillator.type = name === 'wrong' ? 'sine' : 'triangle'
      oscillator.frequency.value = frequency
      gain.gain.setValueAtTime(0.0001, now + index * 0.09)
      gain.gain.exponentialRampToValueAtTime(name === 'wrong' ? 0.04 : 0.08, now + index * 0.09 + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + index * 0.09 + 0.2)
      oscillator.connect(gain).connect(audioContext.destination)
      oscillator.start(now + index * 0.09)
      oscillator.stop(now + index * 0.09 + 0.22)
    })
  } catch {
    // Audio is an enhancement and can be unavailable in restricted browsers.
  }
}
