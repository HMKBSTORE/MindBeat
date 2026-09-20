import { useNavigate } from 'react-router-dom'
import { LogOut, Swords } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { BADGES } from '../utils/gamification'

export default function Profile() {
  const { profile, logout } = useAuth()
  const navigate = useNavigate()
  if (!profile) return null

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-4">
      <div className="flex flex-col items-center mb-6">
        <div className="text-6xl mb-2">{profile.avatar}</div>
        <h1 className="text-xl font-extrabold display">{profile.name}</h1>
        
      </div>

      <div className="grid grid-cols-3 gap-2 mb-6">
        <Stat label="Points" value={profile.points} />
        <Stat label="Streak" value={`🔥${profile.streak}`} />
        <Stat label="Best" value={profile.longestStreak || 0} />
      </div>

      <button onClick={() => navigate('/challenge')} className="btn-primary w-full mb-6 flex items-center justify-center gap-2">
        <Swords size={20} /> Challenge a Friend
      </button>

      <h2 className="font-bold text-ink/60 text-sm uppercase tracking-wide mb-2">Badges</h2>
      <div className="flex flex-wrap gap-2 mb-6">
        {(profile.badges || []).length === 0 && (
          <p className="text-ink/40 font-medium text-sm">No badges yet — keep playing!</p>
        )}
        {(profile.badges || []).map((b) => (
          <div key={b} className="bg-sun/20 rounded-full px-4 py-2 font-semibold text-sm flex items-center gap-1.5">
            <span>{BADGES[b]?.emoji}</span> {BADGES[b]?.label}
          </div>
        ))}
      </div>

      <h2 className="font-bold text-ink/60 text-sm uppercase tracking-wide mb-2">Recent Games</h2>
      <div className="flex flex-col gap-2 mb-6">
        {(profile.history || []).slice().reverse().slice(0, 10).map((h, i) => (
          <div key={i} className="card flex items-center justify-between py-3">
            <div>
              <p className="font-semibold text-sm">{h.category}</p>
              <p className="text-xs text-ink/40">{h.date}</p>
            </div>
            <span className="font-extrabold text-violet">{h.score}/{h.total}</span>
          </div>
        ))}
        {(profile.history || []).length === 0 && (
          <p className="text-ink/40 font-medium text-sm">No games played yet.</p>
        )}
      </div>

      <button onClick={logout} className="btn-secondary w-full flex items-center justify-center gap-2 text-coral">
        <LogOut size={18} /> Log Out
      </button>
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
