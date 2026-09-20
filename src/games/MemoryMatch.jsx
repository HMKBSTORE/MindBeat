import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { recordGameResult } from '../utils/gamification'

const ICONS = ['🐸', '🦊', '🐼', '🦁', '🐨', '🐵', '🐯', '🦄']

export default function MemoryMatch() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [cards, setCards] = useState(() => shuffleCards())
  const [flipped, setFlipped] = useState([])   // indices currently face-up (max 2)
  const [matched, setMatched] = useState([])   // indices already matched
  const [moves, setMoves] = useState(0)
  const [xpMsg, setXpMsg] = useState('')
  const [finished, setFinished] = useState(false)

  const best = profile?.games?.memory?.best

  useEffect(() => {
    if (flipped.length < 2) return
    const [a, b] = flipped
    setMoves((m) => m + 1)
    if (cards[a] === cards[b]) {
      setMatched((m) => [...m, a, b])
      setFlipped([])
    } else {
      const t = setTimeout(() => setFlipped([]), 700)
      return () => clearTimeout(t)
    }
  }, [flipped, cards])

  useEffect(() => {
    if (matched.length > 0 && matched.length === cards.length && !finished) {
      setFinished(true)
      if (user && profile) {
        recordGameResult(user.uid, profile, { gameId: 'memory', score: moves, compare: 'min' })
          .then(({ pointsEarned, isNewBest }) => {
            setXpMsg(`${pointsEarned > 0 ? `+${pointsEarned} XP` : 'Already earned XP today'}${isNewBest ? ' · New best! 🎉' : ''}`)
            refreshProfile()
          })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [matched])

  function flipCard(i) {
    if (flipped.length === 2 || flipped.includes(i) || matched.includes(i)) return
    setFlipped((f) => [...f, i])
  }

  function restart() {
    setCards(shuffleCards())
    setFlipped([])
    setMatched([])
    setMoves(0)
    setFinished(false)
    setXpMsg('')
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col items-center">
      <button onClick={() => navigate('/play')} className="self-start flex items-center gap-1 text-ink/50 font-semibold mb-4 tap-scale">
        <ChevronLeft size={20} /> Back to Games
      </button>

      <h1 className="text-xl font-extrabold display mb-3">🧠 Memory Match</h1>

      <div className="flex gap-4 mb-4 font-bold text-sm">
        <span className="text-violet">Moves: {moves}</span>
        {best != null && <span className="text-ink/40">Best: {best}</span>}
      </div>

      <div className="grid grid-cols-4 gap-2">
        {cards.map((icon, i) => {
          const isUp = flipped.includes(i) || matched.includes(i)
          return (
            <button
              key={i}
              onClick={() => flipCard(i)}
              className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl tap-scale ${
                isUp ? 'bg-white shadow-sm' : 'bg-violet'
              } ${matched.includes(i) ? 'opacity-40' : ''}`}
            >
              {isUp ? icon : ''}
            </button>
          )
        })}
      </div>

      {finished && (
        <div className="text-center mt-6">
          <p className="font-extrabold display text-lg mb-1">Solved in {moves} moves! 🎉</p>
          {xpMsg && <p className="text-mint font-semibold text-sm mb-3">{xpMsg}</p>}
          <button onClick={restart} className="btn-primary">Play Again</button>
        </div>
      )}
    </div>
  )
}

function shuffleCards() {
  const pairs = [...ICONS, ...ICONS]
  return pairs.sort(() => Math.random() - 0.5)
}
