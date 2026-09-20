import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { BADGES } from '../utils/gamification'
import Loader from '../components/Loader'
import { ChevronLeft, Swords } from 'lucide-react'

// Read-only view of another student's profile, reached by tapping their
// row on the leaderboard. If you view your own, it just shows your profile
// (no edit controls here — that stays on the main Profile tab).
export default function PublicProfile() {
  const { studentId } = useParams()
  const navigate = useNavigate()
  const { profile: myProfile } = useAuth()
  const [student, setStudent] = useState(null)

  useEffect(() => {
    async function load() {
      const snap = await getDoc(doc(db, 'students', studentId))
      if (snap.exists()) setStudent({ id: snap.id, ...snap.data() })
    }
    load()
  }, [studentId])

  if (student === null) return <Loader label="Loading profile..." />

  const isMe = myProfile?.id === studentId

  return (
    <div className="max-w-md mx-auto px-5 pt-6 pb-4">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-ink/50 font-semibold mb-4 tap-scale">
        <ChevronLeft size={20} /> Back
      </button>

      <div className="flex flex-col items-center mb-6">
        <div className="text-6xl mb-2">{student.avatar}</div>
        <h1 className="text-xl font-extrabold display">{student.name}{isMe && ' (You)'}</h1>
        
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <Stat label="Points" value={student.points} />
        <Stat label="Streak" value={`🔥${student.streak}`} />
        <Stat label="Best" value={student.longestStreak || 0} />
      </div>

      {!isMe && (
        <button
          onClick={() => navigate('/challenge')}
          className="btn-primary w-full mb-6 flex items-center justify-center gap-2"
        >
          <Swords size={20} /> Challenge {firstName(student.name)}
        </button>
      )}

      <h2 className="font-bold text-ink/60 text-sm uppercase tracking-wide mb-2">Badges</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {(student.badges || []).length === 0 && (
          <p className="text-ink/40 font-medium text-sm">No badges yet.</p>
        )}
        {(student.badges || []).map((b) => (
          <div key={b} className="bg-sun/20 rounded-full px-4 py-2 font-semibold text-sm flex items-center gap-1.5">
            <span>{BADGES[b]?.emoji}</span> {BADGES[b]?.label}
          </div>
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }) {
  return (
    <div className="card text-center py-4">
      <p className="font-extrabold text-lg display">{value}</p>
      <p className="text-xs text-ink/50 font-medium">{label}</p>
    </div>
  )
}

function firstName(fullName = '') {
  return fullName.split(' ')[0]
}
