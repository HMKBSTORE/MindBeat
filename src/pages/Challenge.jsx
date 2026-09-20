import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  collection, getDocs, query, where, addDoc, serverTimestamp,
  doc, updateDoc, onSnapshot, orderBy
} from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import questionBank from '../data/questions.json'
import Loader from '../components/Loader'
import { Swords } from 'lucide-react'

// Async head-to-head: Student A picks an opponent, a random 5-question set
// is generated and saved once. Both students answer it separately, whenever
// they're free — whoever scores higher wins. No need for both to be online
// at the same time, which keeps this simple and reliable.
export default function Challenge() {
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [results, setResults] = useState([])
  const [myChallenges, setMyChallenges] = useState(null)

  useEffect(() => {
    if (!user) return
    const q = query(collection(db, 'challenges'), where('participants', 'array-contains', user.uid))
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAtMs || 0) - (a.createdAtMs || 0))
      setMyChallenges(list)
    })
    return unsub
  }, [user])

  async function handleSearch(e) {
    e.preventDefault()
    if (!search.trim()) return setResults([])
    const snap = await getDocs(collection(db, 'students'))
    const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
    setResults(
      all.filter((s) => s.id !== user.uid && s.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)
    )
  }

  async function sendChallenge(opponent) {
    const pool = questionBank.questions
    const picks = shuffle(pool).slice(0, 5).map((q) => q.id)
    await addDoc(collection(db, 'challenges'), {
      participants: [user.uid, opponent.id],
      fromId: user.uid,
      fromName: profile.name,
      toId: opponent.id,
      toName: opponent.name,
      questionIds: picks,
      scores: {},
      status: 'pending',
      createdAtMs: Date.now(),
      createdAt: serverTimestamp()
    })
    setResults([])
    setSearch('')
  }

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-4">
      <h1 className="text-2xl font-extrabold display mb-1 flex items-center gap-2">
        <Swords className="text-coral" /> Challenges
      </h1>
      <p className="text-ink/50 font-medium mb-5">Challenge a classmate to beat your score.</p>

      <form onSubmit={handleSearch} className="flex gap-2 mb-3">
        <input
          className="input"
          placeholder="Search a classmate's name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button className="btn-secondary shrink-0" type="submit">Find</button>
      </form>

      {results.length > 0 && (
        <div className="flex flex-col gap-2 mb-6">
          {results.map((r) => (
            <div key={r.id} className="card flex items-center gap-3">
              <span className="text-2xl">{r.avatar}</span>
              <div className="flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-ink/40">Player</p>
              </div>
              <button onClick={() => sendChallenge(r)} className="btn-secondary text-sm px-4 py-2">
                Challenge
              </button>
            </div>
          ))}
        </div>
      )}

      <h2 className="font-bold text-ink/60 text-sm uppercase tracking-wide mb-2">My Challenges</h2>
      {myChallenges === null ? <Loader label="Loading challenges..." /> : (
        <div className="flex flex-col gap-2">
          {myChallenges.length === 0 && (
            <p className="text-ink/40 font-medium text-center py-8">No challenges yet — search a friend above!</p>
          )}
          {myChallenges.map((c) => (
            <ChallengeRow key={c.id} challenge={c} myUid={user.uid} onPlay={() => navigate(`/challenge/${c.id}`)} />
          ))}
        </div>
      )}
    </div>
  )
}

function ChallengeRow({ challenge, myUid, onPlay }) {
  const opponentName = challenge.fromId === myUid ? challenge.toName : challenge.fromName
  const iHavePlayed = challenge.scores?.[myUid] !== undefined
  const bothPlayed = Object.keys(challenge.scores || {}).length === 2

  let statusText = 'Tap to play'
  if (bothPlayed) {
    const myScore = challenge.scores[myUid]
    const otherUid = Object.keys(challenge.scores).find((id) => id !== myUid)
    const otherScore = challenge.scores[otherUid]
    statusText = myScore > otherScore ? 'You won! 🎉' : myScore < otherScore ? 'You lost — rematch?' : "It's a tie!"
  } else if (iHavePlayed) {
    statusText = `Waiting for ${opponentName}...`
  }

  return (
    <button onClick={onPlay} className="card flex items-center justify-between tap-scale text-left">
      <div>
        <p className="font-semibold">vs {opponentName}</p>
        <p className="text-sm text-ink/50">{statusText}</p>
      </div>
      <span className="text-xl">⚔️</span>
    </button>
  )
}

function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5)
}
