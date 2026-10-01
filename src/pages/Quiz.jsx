import { useEffect, useMemo, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { recordQuizResult, BADGES } from '../utils/gamification'
import questionBank from '../data/questions.json'
import Loader from '../components/Loader'
import { playSound } from '../utils/audio'
import { launchConfetti } from '../utils/confetti'
import StaticBannerAd from '../components/StaticBannerAd'
import { callRewardFunction } from '../utils/rewardClient'

const QUESTIONS_PER_ROUND = 5
const SECONDS_PER_QUESTION = 15

export default function Quiz() {
  const { categoryId } = useParams()
  const navigate = useNavigate()
  const { user, profile, refreshProfile, rewardEligibility } = useAuth()

  const category = questionBank.categories.find((c) => c.id === categoryId)

  const [questions, setQuestions] = useState(null) // null = still loading
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)   // option index the student picked
  const [locked, setLocked] = useState(false)       // prevents double answers
  const [correctCount, setCorrectCount] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION)
  const [finished, setFinished] = useState(false)
  const [result, setResult] = useState(null)
  const [rewardAttemptId, setRewardAttemptId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [rewardResult, setRewardResult] = useState(null)
  const [rewardError, setRewardError] = useState('')

  // Load questions: local starter bank + anything the admin added to Firestore, merged.
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (rewardEligibility === 'checking') return
      if (user && rewardEligibility === 'eligible') {
        try {
          const attempt = await callRewardFunction('startRewardQuiz', { categoryId })
          if (!cancelled) {
            setRewardAttemptId(attempt.attemptId)
            setQuestions(attempt.questions)
          }
          return
        } catch (error) {
          console.warn('Could not start the points-eligible quiz attempt; continuing with the standard quiz.', error)
        }
      }

      const local = questionBank.questions.filter((q) => q.category === categoryId)
      let remote = []
      try {
        const snap = await getDocs(query(collection(db, 'questions'), where('category', '==', categoryId)))
        remote = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      } catch (e) {
        // If Firestore isn't set up yet, just fall back to local questions — don't crash the quiz.
        console.warn('Could not load admin questions, using starter set only.', e)
      }
      const merged = shuffle([...local, ...remote]).slice(0, QUESTIONS_PER_ROUND)
      if (!cancelled) setQuestions(merged)
    }
    load()
    return () => { cancelled = true }
  }, [categoryId, rewardEligibility, user])

  const current = questions?.[index]

  const handleAnswer = useCallback((optionIndex) => {
    if (locked || !current) return
    setLocked(true)
    setSelected(optionIndex)
    setAnswers((previous) => ({ ...previous, [current.id]: optionIndex }))
    if (optionIndex === current.answer) {
      setCorrectCount((c) => c + 1)
      playSound('correct')
    } else {
      playSound('wrong')
    }
  }, [locked, current])

  // Countdown timer per question
  useEffect(() => {
    if (!current || locked || finished) return
    if (timeLeft <= 0) {
      handleAnswer(-1) // -1 = ran out of time, counts as wrong, no crash
      return
    }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
  }, [timeLeft, locked, current, finished, handleAnswer])

  function nextQuestion() {
    if (index + 1 >= (questions?.length || 0)) {
      finishQuiz(correctCount + (selected === current.answer ? 1 : 0))
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
      setLocked(false)
      setTimeLeft(SECONDS_PER_QUESTION)
    }
  }

  async function finishQuiz(finalCorrect = correctCount) {
    setCorrectCount(finalCorrect)
    setFinished(true)
    launchConfetti()
    if (user && profile) {
      const res = await recordQuizResult(user.uid, profile, {
        correct: finalCorrect,
        total: questions.length,
        categoryLabel: category?.label || categoryId
      })
      setResult(res)
      if (res.newStreak > profile.streak) playSound('streak')
      if (rewardAttemptId) {
        try {
          const points = await callRewardFunction('completeRewardQuiz', {
            attemptId: rewardAttemptId,
            answers: questions.map((question) => ({
              questionId: question.id,
              answerIndex: answers[question.id] ?? -1,
            })),
          })
          setRewardResult(points)
          if (points.pointsAwarded > 0) await refreshProfile()
        } catch (error) {
          setRewardError(error.message || 'Quiz reward could not be verified.')
        }
      }
      refreshProfile()
    }
  }

  const progressPct = useMemo(
    () => questions ? Math.round((index / questions.length) * 100) : 0,
    [index, questions]
  )

  if (questions === null) return <Loader label="Loading questions..." />

  if (questions.length === 0) {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center">
        <p className="text-4xl mb-3">🚧</p>
        <p className="font-semibold text-ink/70">No questions in this category yet.</p>
        <button onClick={() => navigate('/play')} className="btn-secondary mt-5">Back to categories</button>
      </div>
    )
  }

  if (finished) {
    return <ResultScreen
      correct={correctCount}
      total={questions.length}
      result={result}
      rewardResult={rewardResult}
      rewardError={rewardError}
      category={category}
      navigate={navigate}
    />
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col min-h-screen">
      {/* Progress bar */}
      <div className="h-2 bg-violet-light rounded-full mb-5 overflow-hidden">
        <div className="h-full bg-violet transition-all duration-300" style={{ width: `${progressPct}%` }} />
      </div>

      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-ink/50">
          Question {index + 1} / {questions.length}
        </span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${
          timeLeft <= 5 ? 'bg-coral/15 text-coral' : 'bg-violet-light text-violet'
        }`}>
          ⏱ {timeLeft}s
        </span>
      </div>

      <h2 className="text-xl font-extrabold display mb-6 leading-snug">{current.question}</h2>

      <div className="flex flex-col gap-3">
        {current.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => handleAnswer(i)}
            disabled={locked}
            className={optionClasses(locked, selected, current.answer, i)}
          >
            {opt}
          </button>
        ))}
      </div>

      {locked && (
        <button onClick={nextQuestion} className="btn-primary mt-auto sticky bottom-4">
          {index + 1 >= questions.length ? 'See Results' : 'Next Question'} →
        </button>
      )}
      <div className="mt-6 flex justify-center overflow-hidden">
        <StaticBannerAd
          adKey="e6a90c81da6ce7259296f90e8cd187e8"
          label="Sponsored quiz banner"
          className="ad-frame-native"
        />
      </div>
    </div>
  )
}

function optionClasses(locked, selected, correctIndex, i) {
  const base = 'tap-scale text-left font-semibold rounded-2xl px-5 py-4 border-2 transition-colors'
  if (!locked) return `${base} border-violet-light bg-white`
  if (i === correctIndex) return `${base} border-mint bg-mint/10 text-mint`
  if (i === selected) return `${base} border-coral bg-coral/10 text-coral`
  return `${base} border-violet-light bg-white opacity-50`
}

function ResultScreen({ correct, total, result, rewardResult, rewardError, category, navigate }) {
  const pct = Math.round((correct / total) * 100)
  const isGreat = pct >= 80

  return (
    <div className="max-w-md mx-auto px-5 pt-16 pb-8 text-center flex flex-col items-center min-h-screen">
      <div className="text-6xl mb-3">{isGreat ? '🎉' : pct >= 50 ? '👏' : '💪'}</div>
      <h1 className="text-2xl font-extrabold display mb-1">
        {isGreat ? 'Amazing!' : pct >= 50 ? 'Nice one!' : 'Good try!'}
      </h1>
      <p className="text-ink/50 font-medium mb-6">{category?.label}</p>

      <div className="card w-full mb-4">
        <p className="text-5xl font-extrabold display text-violet">{correct}/{total}</p>
        <p className="text-ink/50 font-medium mt-1">questions correct</p>
      </div>

      {result && (
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          <div className="card">
            <p className="font-extrabold text-lg text-sun">+{result.pointsEarned} XP</p>
            <p className="text-xs text-ink/50 font-medium">XP earned</p>
          </div>
          <div className="card">
            <p className="font-extrabold text-lg text-coral">🔥 {result.newStreak}</p>
            <p className="text-xs text-ink/50 font-medium">Day streak</p>
          </div>
        </div>
      )}

      {rewardResult?.pointsAwarded > 0 && (
        <div className="mb-4 w-full rounded-2xl border-2 border-mint/30 bg-mint/10 px-4 py-3">
          <p className="font-extrabold text-mint">+{rewardResult.pointsAwarded} reward points</p>
          <p className="text-xs font-medium text-ink/50">Added separately from XP to your wallet.</p>
        </div>
      )}
      {rewardResult && rewardResult.pointsAwarded === 0 && (
        <p className="mb-4 text-sm font-medium text-ink/50">
          {rewardResult.reason === 'minimum_accuracy_not_met'
            ? 'This quiz did not meet the accuracy needed for reward points.'
            : 'This quiz reward was already claimed.'}
        </p>
      )}
      {rewardError && <p role="status" className="mb-4 text-sm font-medium text-ink/50">Reward points could not be verified right now. Your XP result is saved.</p>}

      {result?.newBadges?.length > 0 && (
        <div className="w-full mb-4">
          {result.newBadges.map((b) => (
            <div key={b} className="bg-sun/20 text-ink rounded-2xl px-4 py-3 font-semibold flex items-center gap-2 justify-center mb-2">
              <span className="text-xl">{BADGES[b].emoji}</span> New badge: {BADGES[b].label}!
            </div>
          ))}
        </div>
      )}

      <button
        onClick={() => shareScore(correct, total)}
        className="btn-secondary w-full mb-3"
      >
        Share my score 📤
      </button>
      <button onClick={() => navigate('/play')} className="btn-primary w-full">
        Play Again
      </button>
    </div>
  )
}

function shareScore(correct, total) {
  const text = `I scored ${correct}/${total} on MindBeat! Think you can beat me? 🧠⚡`
  if (navigator.share) {
    navigator.share({ text }).catch(() => {})
  } else {
    navigator.clipboard.writeText(text)
    alert('Score copied — paste it anywhere to share!')
  }
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}
