import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { recordDailyChallengeResult } from '../utils/gamification'
import Loader from '../components/Loader'
import questionBank from '../data/questions.json'
import { playSound } from '../utils/audio'
import { launchConfetti } from '../utils/confetti'
import StaticBannerAd from '../components/StaticBannerAd'

const SECONDS_PER_QUESTION = 15
const QUESTIONS_IN_CHALLENGE = 5

// A mixed-category quiz that's THE SAME for every player on a given day
// (seeded shuffle using today's date as the seed) — so friends can compare
// "did you beat my Daily Challenge score?" Pulls from whatever questions
// you've added in Admin — all categories combined. Awards a one-time bonus.
export default function DailyChallenge() {
  const navigate = useNavigate()
  const { user, profile, refreshProfile } = useAuth()

  const [todaysQuestions, setTodaysQuestions] = useState(null) // null = loading
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [locked, setLocked] = useState(false)
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION)
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState(null)

  useEffect(() => {
    async function load() {
      const dateKey = new Date().toDateString()
      const cached = JSON.parse(localStorage.getItem(`mindbeat:daily:${dateKey}`) || 'null')
      if (cached?.length) { setTodaysQuestions(cached); return }
      let remote = []
      try {
        const snap = await getDocs(collection(db, 'questions'))
        remote = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      } catch (error) {
        console.warn('Could not load daily questions from Firestore.', error)
      }
      const local = questionBank.questions
      const all = [...local, ...remote]
      const seed = hashString(dateKey)
      const daily = seededShuffle(all, seed).slice(0, QUESTIONS_IN_CHALLENGE)
      localStorage.setItem(`mindbeat:daily:${dateKey}`, JSON.stringify(daily))
      setTodaysQuestions(daily)
    }
    load()
  }, [])

  const current = todaysQuestions?.[index]

  const handleAnswer = useCallback((optionIndex) => {
    if (locked || !current) return
    setLocked(true)
    setSelected(optionIndex)
    if (optionIndex === current.answer) { setCorrectCount((c) => c + 1); playSound('correct') }
    else playSound('wrong')
  }, [locked, current])

  useEffect(() => {
    if (!current || locked || finished) return
    if (timeLeft <= 0) { handleAnswer(-1); return }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, locked, current, finished, handleAnswer])

  function next() {
    if (index + 1 >= todaysQuestions.length) {
      finish(correctCount + (selected === current.answer ? 1 : 0))
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
      setLocked(false)
      setTimeLeft(SECONDS_PER_QUESTION)
    }
  }

  async function finish(finalCorrect = correctCount) {
    setCorrectCount(finalCorrect)
    setFinished(true)
    launchConfetti()
    if (user && profile) {
      const res = await recordDailyChallengeResult(user.uid, profile, {
        correct: finalCorrect, total: todaysQuestions.length
      })
      setResult(res)
      if (res.newStreak > profile.streak) playSound('streak')
      refreshProfile()
    }
  }

  if (todaysQuestions === null) return <Loader label="Loading today's challenge..." />

  if (todaysQuestions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center">
        <p className="text-4xl mb-3">🚧</p>
        <p className="font-semibold text-ink/70">No questions added yet — check back once some are added!</p>
        <button onClick={() => navigate('/')} className="btn-secondary mt-5">Back Home</button>
      </div>
    )
  }

  if (finished) {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 pb-8 text-center flex flex-col items-center min-h-screen">
        <div className="text-6xl mb-3">🌟</div>
        <h1 className="text-2xl font-extrabold display mb-1">Daily Challenge Done!</h1>
        <div className="card w-full mb-4 mt-4">
          <p className="text-5xl font-extrabold display text-violet">{correctCount}/{todaysQuestions.length}</p>
          <p className="text-ink/50 font-medium mt-1">questions correct</p>
        </div>
        {result && (
          <div className="w-full grid grid-cols-2 gap-3 mb-4">
            <div className="card">
              <p className="font-extrabold text-lg text-sun">+{result.pointsEarned} XP</p>
              <p className="text-xs text-ink/50 font-medium">
                {result.bonus > 0 ? `Includes +${result.bonus} daily bonus` : 'Bonus already claimed today'}
              </p>
            </div>
            <div className="card">
              <p className="font-extrabold text-lg text-coral">🔥 {result.newStreak}</p>
              <p className="text-xs text-ink/50 font-medium">Day streak</p>
            </div>
          </div>
        )}
        <button onClick={() => navigate('/')} className="btn-primary w-full">Back Home</button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col min-h-screen">
      <div className="h-2 bg-violet-light rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-sun transition-all duration-300" style={{ width: `${(index / todaysQuestions.length) * 100}%` }} />
      </div>
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-ink/50">🌟 Daily Challenge · {index + 1}/{todaysQuestions.length}</span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${timeLeft <= 5 ? 'bg-coral/15 text-coral' : 'bg-violet-light text-violet'}`}>
          ⏱ {timeLeft}s
        </span>
      </div>
      <h2 className="text-xl font-extrabold display mb-6 leading-snug">{current.question}</h2>
      <div className="flex flex-col gap-3">
        {current.options.map((opt, i) => (
          <button key={i} onClick={() => handleAnswer(i)} disabled={locked}
            className={`tap-scale text-left font-semibold rounded-2xl px-5 py-4 border-2 ${
              !locked ? 'border-violet-light bg-white'
              : i === current.answer ? 'border-mint bg-mint/10 text-mint'
              : i === selected ? 'border-coral bg-coral/10 text-coral'
              : 'border-violet-light bg-white opacity-50'
            }`}>
            {opt}
          </button>
        ))}
      </div>
      {locked && (
        <button onClick={next} className="btn-primary mt-auto sticky bottom-4">
          {index + 1 >= todaysQuestions.length ? 'Finish' : 'Next'} →
        </button>
      )}
      <div className="mt-6 flex justify-center overflow-hidden">
        <StaticBannerAd
          adKey="cec18556d49d26ed90145b3d0897b9b7"
          width={728}
          height={90}
          label="Sponsored daily challenge banner"
          className="ad-frame-banner"
        />
      </div>
    </div>
  )
}

function hashString(str) {
  let hash = 0
  for (let i = 0; i < str.length; i++) hash = (hash * 31 + str.charCodeAt(i)) | 0
  return hash
}
function seededShuffle(arr, seed) {
  const a = [...arr]
  let s = seed
  function rand() {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    return s / 0x7fffffff
  }
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
