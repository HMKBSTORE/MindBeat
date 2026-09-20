import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { recordGameResult } from '../utils/gamification'

const LINES = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6]
]

// Simple vs-bot Tic-Tac-Toe. Bot: wins if it can, blocks if it must,
// otherwise picks center/corner/random — good enough to feel like a
// real opponent without needing a heavy minimax algorithm.
export default function TicTacToe() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const [board, setBoard] = useState(Array(9).fill(null))
  const [turn, setTurn] = useState('player') // 'player' | 'bot'
  const [result, setResult] = useState(null) // 'win' | 'lose' | 'draw' | null
  const [xpMsg, setXpMsg] = useState('')

  const wins = profile?.games?.tictactoe?.best || 0

  function checkWinner(b) {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a]
    }
    return b.every(Boolean) ? 'draw' : null
  }

  function handlePlay(i) {
    if (board[i] || result || turn !== 'player') return
    const next = [...board]
    next[i] = 'X'
    applyMove(next)
  }

  function applyMove(next) {
    setBoard(next)
    const winner = checkWinner(next)
    if (winner === 'X') return handleResult('win')
    if (winner === 'draw') return handleResult('draw')
    setTurn('bot')
    setTimeout(() => botMove(next), 500)
  }

  function handleResult(outcome) {
    setResult(outcome)
    if (outcome === 'win' && user && profile) {
      const newWinCount = wins + 1
      recordGameResult(user.uid, profile, { gameId: 'tictactoe', score: newWinCount, compare: 'max' })
        .then(({ pointsEarned }) => {
          setXpMsg(pointsEarned > 0 ? `+${pointsEarned} XP` : 'Already earned XP today')
          refreshProfile()
        })
    }
  }

  function botMove(current) {
    const empty = current.map((v, i) => (v ? null : i)).filter((v) => v !== null)
    if (empty.length === 0) return

    // 1. Win if possible
    let move = findWinningMove(current, 'O') ??
    // 2. Block player's win
               findWinningMove(current, 'X') ??
    // 3. Take center, else a corner, else random
               (current[4] === null ? 4 : null) ??
               [0, 2, 6, 8].find((i) => current[i] === null) ??
               empty[Math.floor(Math.random() * empty.length)]

    const next = [...current]
    next[move] = 'O'
    setBoard(next)
    const winner = checkWinner(next)
    if (winner === 'O') return handleResult('lose')
    if (winner === 'draw') return handleResult('draw')
    setTurn('player')
  }

  function findWinningMove(b, mark) {
    for (const [a, c, d] of LINES) {
      const line = [b[a], b[c], b[d]]
      const marks = line.filter((v) => v === mark).length
      const empties = line.filter((v) => v === null).length
      if (marks === 2 && empties === 1) {
        const idx = [a, c, d][line.indexOf(null)]
        return idx
      }
    }
    return null
  }

  function restart() {
    setBoard(Array(9).fill(null))
    setTurn('player')
    setResult(null)
    setXpMsg('')
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col items-center">
      <button onClick={() => navigate('/games')} className="self-start flex items-center gap-1 text-ink/50 font-semibold mb-3 tap-scale">
        <ChevronLeft size={20} /> Back to Games
      </button>

      <h1 className="text-2xl font-extrabold display mb-1">Tic-Tac-Toe</h1>
      <p className="text-ink/50 font-medium mb-1">You're X — beat the bot!</p>
      {wins > 0 && <p className="text-xs text-ink/40 font-semibold mb-4">Total wins: {wins}</p>}

      <div className="grid grid-cols-3 gap-2 w-full max-w-[280px] mb-6">
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handlePlay(i)}
            disabled={!!cell || !!result || turn !== 'player'}
            className="aspect-square bg-white border-2 border-violet-light rounded-2xl
                       flex items-center justify-center text-4xl font-extrabold tap-scale"
          >
            {cell === 'X' && <span className="text-violet">X</span>}
            {cell === 'O' && <span className="text-coral">O</span>}
          </button>
        ))}
      </div>

      {result && (
        <div className="card w-full text-center mb-4">
          <p className="text-3xl mb-1">{result === 'win' ? '🎉' : result === 'lose' ? '🤖' : '🤝'}</p>
          <p className="font-extrabold display text-lg">
            {result === 'win' ? 'You Won!' : result === 'lose' ? 'Bot Won!' : "It's a Draw!"}
          </p>
          {xpMsg && <p className="text-mint font-semibold text-sm mt-1">{xpMsg}</p>}
        </div>
      )}

      <button onClick={restart} className="btn-primary w-full max-w-[280px]">
        {result ? 'Play Again' : 'Restart'}
      </button>
    </div>
  )
}
