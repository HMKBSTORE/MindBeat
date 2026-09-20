import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import questionBank from '../data/questions.json'
import Loader from '../components/Loader'

const SECONDS_PER_QUESTION = 15

// Plays a fixed, pre-picked set of questions tied to one challenge document,
// then writes this student's score into challenge.scores[uid].
export default function ChallengePlay() {
  const { challengeId } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()

  const [challenge, setChallenge] = useState(null)
  const [questions, setQuestions] = useState(null)
  const [index, setIndex] = useState(0)
  const [selected, setSelected] = useState(null)
  const [locked, setLocked] = useState(false)
  const [correct, setCorrect] = useState(0)
  const [timeLeft, setTimeLeft] = useState(SECONDS_PER_QUESTION)
  const [done, setDone] = useState(false)
  const [alreadyPlayed, setAlreadyPlayed] = useState(false)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'challenges', challengeId))
      if (!snap.exists()) return
      const data = snap.data()
      setChallenge(data)
      if (data.scores?.[user.uid] !== undefined) {
        setAlreadyPlayed(true)
        setCorrect(data.scores[user.uid])
        setDone(true)
        return
      }
      const qs = data.questionIds
        .map((id) => questionBank.questions.find((q) => q.id === id))
        .filter(Boolean)
      setQuestions(qs)
    }
    load()
  }, [challengeId, user])

  const current = questions?.[index]

  useEffect(() => {
    if (!current || locked || done) return
    if (timeLeft <= 0) { handleAnswer(-1); return }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeLeft, locked, current, done])

  function handleAnswer(i) {
    if (locked) return
    setLocked(true)
    setSelected(i)
    if (i === current.answer) setCorrect((c) => c + 1)
  }

  async function next() {
    if (index + 1 >= questions.length) {
      await updateDoc(doc(db, 'challenges', challengeId), {
        [`scores.${user.uid}`]: correct
      })
      setDone(true)
    } else {
      setIndex((i) => i + 1)
      setSelected(null)
      setLocked(false)
      setTimeLeft(SECONDS_PER_QUESTION)
    }
  }

  if (!challenge || (questions === null && !alreadyPlayed)) return <Loader />

  if (done) {
    return (
      <div className="max-w-md mx-auto px-5 pt-16 text-center">
        <p className="text-5xl mb-3">⚔️</p>
        <h1 className="text-2xl font-extrabold display mb-2">
          {alreadyPlayed ? "You already played this one" : 'Challenge submitted!'}
        </h1>
        <p className="text-ink/60 font-medium mb-6">You scored {correct}/5</p>
        <button onClick={() => navigate('/play?tab=challenges')} className="btn-primary" >
          Back to Challenges
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4 flex flex-col min-h-screen">
      <div className="flex justify-between items-center mb-6">
        <span className="text-sm font-semibold text-ink/50">Question {index + 1} / {questions.length}</span>
        <span className={`text-sm font-bold px-3 py-1 rounded-full ${timeLeft <= 5 ? 'bg-coral/15 text-coral' : 'bg-violet-light text-violet'}`}>
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
            className={`tap-scale text-left font-semibold rounded-2xl px-5 py-4 border-2 ${
              !locked ? 'border-violet-light bg-white'
              : i === current.answer ? 'border-mint bg-mint/10 text-mint'
              : i === selected ? 'border-coral bg-coral/10 text-coral'
              : 'border-violet-light bg-white opacity-50'
            }`}
          >
            {opt}
          </button>
        ))}
      </div>
      {locked && (
        <button onClick={next} className="btn-primary mt-auto sticky bottom-4">
          {index + 1 >= questions.length ? 'Submit' : 'Next'} →
        </button>
      )}
    </div>
  )
}
