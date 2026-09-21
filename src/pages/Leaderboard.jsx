import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { collection, getDocs, orderBy, query } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import Loader from '../components/Loader'
import StaticBannerAd from '../components/StaticBannerAd'

// Single global leaderboard — MindBeat isn't just for one school anymore,
// so class/school splitting is gone. Simple, familiar "Rank" list like most
// competitive apps use: top players, with your own rank pinned if you're
// not in the visible top slice.
export default function Leaderboard() {
  const { profile } = useAuth()
  const navigate = useNavigate()
  const [students, setStudents] = useState(null)

  useEffect(() => {
    async function load() {
      const snap = await getDocs(query(collection(db, 'students'), orderBy('points', 'desc')))
      setStudents(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
    }
    load()
  }, [])

  if (students === null) return <Loader label="Loading rank..." />

  const myRank = students.findIndex((s) => s.id === profile?.id) + 1

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-4">
      <section className="relative mb-6 overflow-hidden rounded-3xl border-2 border-sun/30 bg-gradient-to-br from-violet via-violet-dark to-coral p-5 text-white shadow-[0_10px_0_0_rgba(78,36,190,0.14)]">
        <div className="absolute -right-4 -top-5 text-6xl opacity-20" aria-hidden="true">🏆</div>
        <div className="absolute -bottom-6 right-16 text-5xl opacity-15" aria-hidden="true">💸</div>
        <div className="relative">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-[0.14em] text-sun">Champion challenge</p>
          <h2 className="max-w-[19rem] font-display text-2xl font-extrabold leading-tight sm:text-3xl">
            Reach 🏆 5,000 XP — FIRST PLAYER WINS Rs 500 CASH 💸
          </h2>
          <p className="mt-3 max-w-[22rem] text-sm font-semibold leading-relaxed text-white/80">
            Compete daily with your classmates! Once a champion hits the goal, check your registered email for cash reward details.
          </p>
        </div>
      </section>
      <h1 className="text-2xl font-extrabold display mb-1">Rank 🏆</h1>
      <p className="text-ink/50 font-medium mb-5">Top players across MindBeat.</p>

      <div className="flex flex-col gap-2">
        {students.slice(0, 20).map((s, i) => (
          <Row key={s.id} rank={i + 1} student={s} isMe={s.id === profile?.id}
               onClick={() => navigate(`/student/${s.id}`)} />
        ))}
        {students.length === 0 && (
          <p className="text-center text-ink/40 font-medium py-10">No players yet — be the first!</p>
        )}
      </div>

      {myRank > 20 && (
        <div className="sticky bottom-20 mt-3">
          <Row rank={myRank} student={profile} isMe highlight onClick={() => navigate(`/student/${profile.id}`)} />
        </div>
      )}

      <div className="my-6 flex justify-center">
        <StaticBannerAd
          adKey="c0f1d8d38891544f85367a7b10460988"
          width={300}
          height={250}
          label="Sponsored leaderboard box"
          className="ad-frame ad-frame-square"
        />
      </div>
    </div>
  )
}

function Row({ rank, student, isMe, highlight, onClick }) {
  const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : null
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-2xl px-4 py-3 w-full text-left tap-scale ${
        isMe ? 'bg-violet text-white shadow-md' : 'bg-white'
      } ${highlight ? 'border-2 border-sun' : ''}`}
    >
      <span className={`font-extrabold w-7 text-center ${isMe ? 'text-white' : 'text-ink/40'}`}>
        {medal || `#${rank}`}
      </span>
      <span className="text-2xl">{student.avatar}</span>
      <div className="flex-1 min-w-0">
        <p className="font-semibold truncate">{student.name}{isMe && ' (You)'}</p>
      </div>
      <span className="font-extrabold display">{student.points}</span>
    </button>
  )
}
