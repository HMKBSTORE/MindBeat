import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { recordGameResult } from '../utils/gamification'

const GRID = 16          // 16x16 board — big enough to be fun, small enough for tiny phone screens
const CELL = 20          // pixel size per cell (board = 320x320)
const SPEED_MS = 140      // lower = faster snake

// Classic Snake. Pure client-side canvas + game loop; score/XP sync with
// Firebase the same way the other mini-games do (see recordGameResult).
export default function Snake() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()
  const canvasRef = useRef(null)
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(profile?.games?.snake?.best ?? 0)
  const [gameOver, setGameOver] = useState(false)
  const [running, setRunning] = useState(true)
  const [xpMsg, setXpMsg] = useState('')

  // Game state lives in a ref so the render loop can read it without
  // re-subscribing effects every frame — keeps the loop smooth.
  const stateRef = useRef({
    snake: [{ x: 8, y: 8 }],
    dir: { x: 1, y: 0 },
    nextDir: { x: 1, y: 0 },
    food: randomCell()
  })

  function randomCell() {
    return { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) }
  }

  const setDirection = useCallback((x, y) => {
    const s = stateRef.current
    // prevent reversing directly into yourself
    if (s.dir.x === -x && s.dir.y === -y) return
    s.nextDir = { x, y }
  }, [])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'ArrowUp') setDirection(0, -1)
      if (e.key === 'ArrowDown') setDirection(0, 1)
      if (e.key === 'ArrowLeft') setDirection(-1, 0)
      if (e.key === 'ArrowRight') setDirection(1, 0)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [setDirection])

  useEffect(() => {
    if (!running) return
    const ctx = canvasRef.current.getContext('2d')

    const interval = setInterval(() => {
      const s = stateRef.current
      s.dir = s.nextDir
      const head = { x: s.snake[0].x + s.dir.x, y: s.snake[0].y + s.dir.y }

      const hitWall = head.x < 0 || head.y < 0 || head.x >= GRID || head.y >= GRID
      const hitSelf = s.snake.some((seg) => seg.x === head.x && seg.y === head.y)

      if (hitWall || hitSelf) {
        setGameOver(true)
        setRunning(false)
        const finalScore = s.snake.length - 1
        if (user && profile) {
          recordGameResult(user.uid, profile, { gameId: 'snake', score: finalScore, compare: 'max' })
            .then(({ pointsEarned, isNewBest }) => {
              setXpMsg(`${pointsEarned > 0 ? `+${pointsEarned} XP` : 'Already earned XP today'}${isNewBest ? ' · New best! 🎉' : ''}`)
              if (isNewBest) setBest(finalScore)
              refreshProfile()
            })
        }
        return
      }

      s.snake = [head, ...s.snake]
      if (head.x === s.food.x && head.y === s.food.y) {
        s.food = randomCell()
        setScore((sc) => sc + 1)
      } else {
        s.snake.pop()
      }

      // draw
      ctx.fillStyle = '#FAF9FF'
      ctx.fillRect(0, 0, GRID * CELL, GRID * CELL)
      ctx.fillStyle = '#FF6B5B'
      ctx.fillRect(s.food.x * CELL + 2, s.food.y * CELL + 2, CELL - 4, CELL - 4)
      s.snake.forEach((seg, i) => {
        ctx.fillStyle = i === 0 ? '#4E24BE' : '#6C3CE9'
        ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2)
      })
    }, SPEED_MS)

    return () => clearInterval(interval)
  }, [running, score])

  function restart() {
    stateRef.current = {
      snake: [{ x: 8, y: 8 }],
      dir: { x: 1, y: 0 },
      nextDir: { x: 1, y: 0 },
      food: randomCell()
    }
    setScore(0)
    setGameOver(false)
    setRunning(true)
    setXpMsg('')
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col items-center">
      <button onClick={() => navigate('/games')} className="self-start flex items-center gap-1 text-ink/50 font-semibold mb-3 tap-scale">
        <ChevronLeft size={20} /> Back to Games
      </button>

      <div className="flex justify-between w-full max-w-[320px] mb-3 px-1">
        <p className="font-extrabold display">Score: {score}</p>
        <p className="font-semibold text-ink/50">Best: {best}</p>
      </div>

      <div className="relative">
        <canvas ref={canvasRef} width={GRID * CELL} height={GRID * CELL}
          className="rounded-2xl border-2 border-violet-light" />
        {gameOver && (
          <div className="absolute inset-0 bg-ink/70 rounded-2xl flex flex-col items-center justify-center text-white">
            <p className="text-3xl mb-2">🐍💥</p>
            <p className="font-extrabold display text-xl mb-1">Game Over</p>
            <p className="font-medium mb-1">Score: {score}</p>
            {xpMsg && <p className="text-sun font-semibold text-sm mb-3">{xpMsg}</p>}
            <button onClick={restart} className="btn-primary">Play Again</button>
          </div>
        )}
      </div>

      {/* Touch D-pad — this is the primary control method since most players are on mobile */}
      <div className="grid grid-cols-3 gap-2 mt-6 w-40">
        <div />
        <DpadBtn onClick={() => setDirection(0, -1)}>⬆️</DpadBtn>
        <div />
        <DpadBtn onClick={() => setDirection(-1, 0)}>⬅️</DpadBtn>
        <div />
        <DpadBtn onClick={() => setDirection(1, 0)}>➡️</DpadBtn>
        <div />
        <DpadBtn onClick={() => setDirection(0, 1)}>⬇️</DpadBtn>
        <div />
      </div>
    </div>
  )
}

function DpadBtn({ onClick, children }) {
  return (
    <button onClick={onClick} className="bg-white border-2 border-violet-light rounded-xl h-12 text-xl tap-scale">
      {children}
    </button>
  )
}
