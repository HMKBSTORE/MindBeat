import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { recordGameResult } from '../utils/gamification'

const ROUNDS = 3

// Classic reaction-speed test: wait for the box to turn green, tap as fast as
// possible. Average time across 3 rounds is the score (lower = better).
export default function ReactionTest() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [phase, setPhase] = useState('idle') // idle | waiting | ready | tooSoon | result
  const [round, setRound] = useState(0)
  const [times, setTimes] = useState([])
  const [xpMsg, setXpMsg] = useState('')
  const startRef = useRef(0)
  const timeoutRef = useRef(null)

  const best = profile?.games?.reaction?.best

  function startRound() {
    setPhase('waiting')
    const delay = 1000 + Math.random() * 2500 // random wait so you can't just guess the timing
    timeoutRef.current = setTimeout(() => {
      startRef.current = Date.now()
      setPhase('ready')
    }, delay)
  }

  function handleTap() {
    if (phase === 'idle' || phase === 'result') {
      setTimes([])
      setRound(0)
      startRound()
    } else if (phase === 'waiting') {
      clearTimeout(timeoutRef.current)
      setPhase('tooSoon')
    } else if (phase === 'ready') {
      const reaction = Date.now() - startRef.current
      const newTimes = [...times, reaction]
      setTimes(newTimes)
      if (newTimes.length >= ROUNDS) {
        finish(newTimes)
      } else {
        setRound((r) => r + 1)
        setPhase('idle')
        setTimeout(startRound, 600)
      }
    } else if (phase === 'tooSoon') {
      setPhase('idle')
      setTimeout(startRound, 400)
    }
  }

  async function finish(allTimes) {
    const avg = Math.round(allTimes.reduce((a, b) => a + b, 0) / allTimes.length)
    setPhase('result')
    if (user && profile) {
      const { pointsEarned, isNewBest } = await recordGameResult(user.uid, profile, {
        gameId: 'reaction', score: avg, compare: 'min'
      })
      setXpMsg(`${pointsEarned > 0 ? `+${pointsEarned} XP` : 'Already earned XP today'}${isNewBest ? ' · New best! 🎉' : ''}`)
      refreshProfile()
    }
  }

  useEffect(() => () => clearTimeout(timeoutRef.current), [])

  const avgTime = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : null

  const boxStyles = {
    idle: 'bg-violet-light text-violet',
    waiting: 'bg-coral text-white',
    ready: 'bg-mint text-white',
    tooSoon: 'bg-ink/80 text-white',
    result: 'bg-violet-light text-violet'
  }
  const boxText = {
    idle: 'Tap to Start',
    waiting: 'Wait for green...',
    ready: 'TAP NOW!',
    tooSoon: 'Too soon! Tap to retry',
    result: null
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col items-center">
      <button onClick={() => navigate('/play')} className="self-start flex items-center gap-1 text-ink/50 font-semibold mb-4 tap-scale">
        <ChevronLeft size={20} /> Back to Games
      </button>

      <h1 className="text-xl font-extrabold display mb-2">⚡ Reaction Test</h1>
      <p className="text-ink/50 font-medium mb-4 text-sm">
        {phase === 'result' ? `Average of ${ROUNDS} rounds` : `Round ${Math.min(round + 1, ROUNDS)} of ${ROUNDS}`}
      </p>

      {best != null && <p className="text-xs text-ink/40 font-semibold mb-3">Personal best: {best}ms</p>}

      {phase === 'result' ? (
        <div className="text-center">
          <p className="text-5xl font-extrabold display text-violet mb-2">{avgTime}ms</p>
          <p className="text-ink/50 font-medium mb-2">average reaction time</p>
          {xpMsg && <p className="text-mint font-semibold text-sm mb-4">{xpMsg}</p>}
          <button onClick={handleTap} className="btn-primary">Try Again</button>
        </div>
      ) : (
        <button
          onClick={handleTap}
          className={`w-64 h-64 rounded-3xl flex items-center justify-center text-center font-extrabold display text-xl shadow-sm tap-scale ${boxStyles[phase]}`}
        >
          {boxText[phase]}
        </button>
      )}
    </div>
  )
}
