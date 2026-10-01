import { useEffect, useState } from 'react'
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore'
import { Coins } from 'lucide-react'
import { db } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { callRewardFunction } from '../utils/rewardClient'
import rewardConfig from '../../shared/rewardsConfig.json'

const DAY_MS = 24 * 60 * 60 * 1000

export default function WalletPanel() {
  const { user, profile, refreshProfile, rewardEligibility } = useAuth()
  const [transactions, setTransactions] = useState(null)
  const [ledgerError, setLedgerError] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    if (!user) return undefined
    const entries = query(
      collection(db, 'students', user.uid, 'transactions'),
      orderBy('createdAt', 'desc'),
      limit(12),
    )
    return onSnapshot(entries, (snapshot) => {
      setTransactions(snapshot.docs.map((entry) => ({ id: entry.id, ...entry.data() })))
      setLedgerError('')
    }, () => {
      setTransactions([])
      setLedgerError('Transaction history is temporarily unavailable.')
    })
  }, [user])

  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(interval)
  }, [])

  const lastCheckInMs = profile.lastDailyCheckInAt?.toMillis?.() ?? null
  const availableAtMs = lastCheckInMs == null ? 0 : lastCheckInMs + DAY_MS
  const cooldownMs = Math.max(0, availableAtMs - now)
  const walletPoints = Number.isSafeInteger(profile.walletPoints) ? profile.walletPoints : 0
  const lockedPoints = Number.isSafeInteger(profile.lockedPoints) ? profile.lockedPoints : 0
  const totalPoints = walletPoints + lockedPoints

  async function claimCheckIn() {
    if (busy || rewardEligibility !== 'eligible' || cooldownMs > 0) return
    setBusy(true)
    setMessage('')
    try {
      const result = await callRewardFunction('claimDailyCheckIn')
      if (result.eligible) {
        setMessage(`+${result.pointsAwarded} reward points added to your wallet.`)
      } else if (result.reason === 'cooldown') {
        setMessage('Your check-in is already claimed. Come back when the timer ends.')
      } else {
        setMessage('Today’s check-in has already been claimed.')
      }
      await refreshProfile()
    } catch (error) {
      setMessage(error.message || 'Could not claim today’s check-in.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="mb-6 rounded-3xl border-2 border-violet-light bg-white p-5" aria-labelledby="wallet-heading">
      <div className="mb-4 flex items-center gap-2">
        <Coins className="text-sun" size={21} />
        <h2 id="wallet-heading" className="font-display text-lg font-extrabold">Rewards Wallet</h2>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <WalletStat label="Available points" value={walletPoints} />
        <WalletStat label="Pending points" value={lockedPoints} />
        <WalletStat label="Total points" value={totalPoints} />
        <WalletStat label="Estimated value" value={`${(totalPoints / rewardConfig.POINTS_PER_PKR).toFixed(2)} PKR`} />
      </div>
      <p className="mt-2 text-xs font-medium text-ink/40">Estimate uses {rewardConfig.POINTS_PER_PKR} points per PKR. No withdrawals are available yet.</p>

      <button
        onClick={claimCheckIn}
        disabled={busy || rewardEligibility !== 'eligible' || cooldownMs > 0}
        className="btn-primary mt-4 w-full disabled:cursor-not-allowed"
      >
        {busy ? 'Claiming...' : cooldownMs > 0 ? `Next check-in in ${formatDuration(cooldownMs)}` : `Daily check-in · +${rewardConfig.DAILY_CHECKIN_POINTS} points`}
      </button>
      {rewardEligibility === 'checking' && <p className="mt-2 text-center text-xs font-medium text-ink/45">Checking reward eligibility...</p>}
      {rewardEligibility === 'restricted' && <p className="mt-2 text-center text-xs font-medium text-coral">Reward points are unavailable for this device registration.</p>}
      {rewardEligibility === 'unavailable' && <p className="mt-2 text-center text-xs font-medium text-ink/45">Reward service is unavailable. Your quizzes and XP still work normally.</p>}
      {message && <p role="status" className="mt-2 text-center text-sm font-semibold text-violet">{message}</p>}

      <h3 className="mb-2 mt-6 font-display font-bold">Recent transactions</h3>
      {ledgerError && <p className="text-sm font-medium text-ink/45">{ledgerError}</p>}
      {transactions === null && <p className="text-sm font-medium text-ink/45">Loading transactions...</p>}
      {transactions?.length === 0 && !ledgerError && <p className="text-sm font-medium text-ink/45">No reward transactions yet.</p>}
      <div className="flex flex-col divide-y divide-violet-light">
        {transactions?.map((entry) => (
          <div key={entry.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{entry.description || transactionLabel(entry.type)}</p>
              <p className="text-xs font-medium text-ink/40">{formatDate(entry.createdAt)}</p>
            </div>
            <span className="shrink-0 font-display font-extrabold text-mint">+{entry.points}</span>
          </div>
        ))}
      </div>
    </section>
  )
}

function WalletStat({ label, value }) {
  return (
    <div className="rounded-2xl bg-violet-light/50 px-3 py-3">
      <p className="font-display text-lg font-extrabold text-ink">{value}</p>
      <p className="text-xs font-medium text-ink/50">{label}</p>
    </div>
  )
}

function transactionLabel(type) {
  return type?.replaceAll('_', ' ') || 'Reward transaction'
}

function formatDate(timestamp) {
  return timestamp?.toDate?.().toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) || 'Just now'
}

function formatDuration(milliseconds) {
  const totalMinutes = Math.ceil(milliseconds / 60_000)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return hours ? `${hours}h ${minutes}m` : `${minutes}m`
}
