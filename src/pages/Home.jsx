import { Link } from 'react-router-dom'
import { Flame, Zap, TrendingUp, Gift, LockKeyhole, Sparkles } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { claimMysteryReward } from '../utils/gamification'
import { playSound } from '../utils/audio'
import { useState } from 'react'
import InstallPrompt from '../components/InstallPrompt'

const MYSTERY_BOX_KEY = 'mindbeat:mystery-box-opened-at'
const MYSTERY_BOX_COOLDOWN = 24 * 60 * 60 * 1000

export default function Home() {
  const { profile, refreshProfile } = useAuth()
  if (!profile) return null

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-4">
      <div className="flex items-center gap-3 mb-6">
        <div className="text-4xl">{profile.avatar}</div>
        <div>
          <h1 className="text-xl font-extrabold display">Hey {firstName(profile.name)}! 👋</h1>
          <p className="text-ink/50 text-sm font-medium">Ready to play?</p>
        </div>
      </div>

      {/* Streak banner — the emotional hook that brings students back daily */}
      <div className="bg-gradient-to-br from-coral to-sun rounded-blob p-5 mb-5 text-white">
        <div className="flex items-center gap-2">
          <Flame size={28} />
          <span className="text-3xl font-extrabold display">{profile.streak}</span>
          <span className="font-semibold text-white/90">day streak</span>
        </div>
        <p className="text-sm text-white/80 mt-1 font-medium">
          {profile.streak > 0 ? "Play today to keep it alive!" : "Play a quiz today to start your streak 🔥"}
        </p>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="card flex items-center gap-3">
          <Zap className="text-violet" size={22} />
          <div>
            <p className="font-extrabold text-lg leading-none">{profile.points}</p>
            <p className="text-xs text-ink/50 font-medium">Total Points</p>
          </div>
        </div>
        <div className="card flex items-center gap-3">
          <TrendingUp className="text-mint" size={22} />
          <div>
            <p className="font-extrabold text-lg leading-none">{profile.longestStreak || 0}</p>
            <p className="text-xs text-ink/50 font-medium">Best Streak</p>
          </div>
        </div>
      </div>

      {/* Daily Challenge — the "come back today" hook. Same 5 questions for
          everyone today, with a one-time bonus, so it's worth checking daily
          even if you already played a regular quiz. */}
      <DailyChallengeCard profile={profile} />
      <MysteryBox userId={profile.id} refreshProfile={refreshProfile} />

      <Link to="/play" className="btn-primary w-full text-center block text-xl">
        Play Now 🎮
      </Link>
      <InstallPrompt />
    </div>
  )
}

function MysteryBox({ userId, refreshProfile }) {
  const [openedAt, setOpenedAt] = useState(() => Number(localStorage.getItem(MYSTERY_BOX_KEY) || 0))
  const [reward, setReward] = useState(null)
  const [opening, setOpening] = useState(false)
  const available = Date.now() - openedAt >= MYSTERY_BOX_COOLDOWN

  async function openBox() {
    if (!available || opening) return
    setOpening(true)
    await new Promise((resolve) => setTimeout(resolve, 650))
    const rewards = [
      { type: 'xp', amount: 20, label: '+20 XP', emoji: '⚡' },
      { type: 'xp', amount: 50, label: '+50 XP', emoji: '🌟' },
      { type: 'streakFreeze', label: 'Streak Freeze', emoji: '❄️' }
    ]
    const nextReward = rewards[Math.floor(Math.random() * rewards.length)]
    await claimMysteryReward(userId, nextReward)
    const timestamp = Date.now()
    localStorage.setItem(MYSTERY_BOX_KEY, String(timestamp))
    setOpenedAt(timestamp)
    setReward(nextReward)
    setOpening(false)
    playSound('streak')
    refreshProfile()
  }

  return (
    <section className={`rounded-3xl p-5 mb-5 border-2 transition-all ${available ? 'bg-sun/10 border-sun/30' : 'bg-white border-violet-light'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${available ? 'bg-sun/20 text-sun' : 'bg-violet-light text-violet/50'}`}>
          {available ? <Gift size={25} /> : <LockKeyhole size={22} />}
        </div>
        <div className="flex-1">
          <p className="font-display font-bold text-lg">Daily mystery box</p>
          <p className="text-xs text-ink/50 font-medium">{available ? 'A surprise reward is ready' : 'Your next surprise unlocks in 24 hours'}</p>
        </div>
        <button onClick={openBox} disabled={!available || opening} className="bg-violet text-white rounded-full px-4 py-2 text-sm font-bold tap-scale disabled:opacity-45">
          {opening ? 'Opening...' : available ? 'Open' : 'Locked'}
        </button>
      </div>
      {reward && <div className="mt-4 rounded-2xl bg-white px-4 py-3 text-center animate-[fade-in_300ms_ease-out]"><Sparkles className="inline text-sun mr-1" size={16} /><span className="font-bold">You found {reward.emoji} {reward.label}!</span></div>}
    </section>
  )
}

function DailyChallengeCard({ profile }) {
  const todayKey = new Date().toDateString()
  const done = profile.dailyChallenge?.lastCompletedDate === todayKey

  return (
    <Link
      to={done ? '#' : '/daily-challenge'}
      onClick={(e) => done && e.preventDefault()}
      className={`block rounded-3xl p-5 mb-5 tap-scale ${
        done ? 'bg-mint/15 border-2 border-mint/30' : 'bg-gradient-to-br from-violet to-violet-dark text-white'
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <p className={`font-display font-bold text-lg ${done ? 'text-mint' : 'text-white'}`}>
            {done ? '✅ Daily Challenge Done!' : '🌟 Today\'s Challenge'}
          </p>
          <p className={`text-sm font-medium mt-0.5 ${done ? 'text-ink/50' : 'text-white/80'}`}>
            {done ? 'Come back tomorrow for a new one' : '5 mixed questions · Bonus XP'}
          </p>
        </div>
        {!done && <span className="text-3xl">🎁</span>}
      </div>
    </Link>
  )
}

function firstName(fullName = '') {
  return fullName.split(' ')[0]
}
