import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import questionBank from '../data/questions.json'

const colorMap = { violet: 'bg-violet', mint: 'bg-mint', sun: 'bg-sun', coral: 'bg-coral' }

// Add more here as they're built. Each needs an id (matches the route
// /games/:id), a label, emoji and color from the palette.
const GAMES = [
  { id: 'snake', label: 'Snake', emoji: '🐍', color: 'mint' },
  { id: 'tictactoe', label: 'Tic-Tac-Toe', emoji: '⭕', color: 'violet' },
  { id: 'memory', label: 'Memory Match', emoji: '🧩', color: 'sun' },
  { id: 'reaction', label: 'Reaction Test', emoji: '⚡', color: 'coral' }
]

export default function Play() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('quizzes') // 'quizzes' | 'games'

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-4">
      <div className="flex bg-violet-light rounded-full p-1 mb-6">
        {[['quizzes', '🧠 Quizzes'], ['games', '🎮 Games']].map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`flex-1 py-2.5 rounded-full font-display font-semibold text-sm transition-colors ${
              tab === key ? 'bg-violet text-white' : 'text-violet/70'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'quizzes' ? (
        <>
          <p className="text-ink/50 font-medium mb-4">5 questions. 15 seconds each. Go!</p>
          <div className="grid grid-cols-2 gap-4">
            {questionBank.categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => navigate(`/quiz/${cat.id}`)}
                className={`${colorMap[cat.color]} tap-scale rounded-3xl p-5 text-white text-left flex flex-col gap-6 h-36 shadow-sm`}
              >
                <span className="text-3xl">{cat.emoji}</span>
                <span className="font-display font-bold leading-tight">{cat.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : (
        <>
          <p className="text-ink/50 font-medium mb-4">Quick games for when you need a break.</p>
          <div className="grid grid-cols-2 gap-4">
            {GAMES.map((g) => (
              <button
                key={g.id}
                onClick={() => navigate(`/games/${g.id}`)}
                className={`${colorMap[g.color]} tap-scale rounded-3xl p-5 text-white text-left flex flex-col gap-6 h-36 shadow-sm`}
              >
                <span className="text-3xl">{g.emoji}</span>
                <span className="font-display font-bold leading-tight">{g.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
