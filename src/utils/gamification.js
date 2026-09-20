import { doc, updateDoc, increment, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'

// Called once when a student finishes a quiz round.
// Updates points, streak, play history and awards any new badges — all in one write.
export async function recordQuizResult(uid, profile, { correct, total, categoryLabel }) {
  const pointsEarned = correct * 10
  const today = new Date()
  const todayKey = today.toDateString()
  const alreadyPlayedToday = profile.lastPlayedDate === todayKey

  const newStreak = alreadyPlayedToday ? profile.streak : profile.streak + 1
  const newLongest = Math.max(profile.longestStreak || 0, newStreak)

  const newBadges = computeNewBadges(profile, { correct, total, newStreak })

  const historyEntry = {
    date: todayKey,
    category: categoryLabel,
    score: correct,
    total,
    pointsEarned
  }

  await updateDoc(doc(db, 'students', uid), {
    points: increment(pointsEarned),
    streak: newStreak,
    longestStreak: newLongest,
    lastPlayedDate: todayKey,
    history: arrayUnion(historyEntry),
    ...(newBadges.length ? { badges: arrayUnion(...newBadges) } : {})
  })

  return { pointsEarned, newStreak, newBadges }
}

function computeNewBadges(profile, { correct, total, newStreak }) {
  const existing = profile.badges || []
  const earned = []

  if (correct === total && total > 0 && !existing.includes('perfect-score')) {
    earned.push('perfect-score')
  }
  if (newStreak >= 7 && !existing.includes('streak-7')) {
    earned.push('streak-7')
  }
  if (newStreak >= 30 && !existing.includes('streak-30')) {
    earned.push('streak-30')
  }
  return earned
}

// Central place to describe each badge — used by Profile.jsx to render them
export const BADGES = {
  'perfect-score': { label: 'Perfect Score', emoji: '💯' },
  'streak-7': { label: '7-Day Streak', emoji: '🔥' },
  'streak-30': { label: '30-Day Streak', emoji: '⚡' }
}

const DAILY_BONUS_XP = 50 // one-time flat bonus for finishing today's mixed-category challenge

// Called when a student finishes the Daily Challenge (mixed-category quiz
// on the Home screen). Works like recordQuizResult but adds a flat bonus
// the FIRST time it's completed each day — this is the "come back today"
// hook, same trick apps like Duolingo use with their daily quests.
export async function recordDailyChallengeResult(uid, profile, { correct, total }) {
  const todayKey = new Date().toDateString()
  const alreadyClaimedToday = profile.dailyChallenge?.lastCompletedDate === todayKey
  const bonus = alreadyClaimedToday ? 0 : DAILY_BONUS_XP
  const pointsEarned = correct * 10 + bonus

  const alreadyPlayedToday = profile.lastPlayedDate === todayKey
  const newStreak = alreadyPlayedToday ? profile.streak : profile.streak + 1
  const newLongest = Math.max(profile.longestStreak || 0, newStreak)
  const newBadges = computeNewBadges(profile, { correct, total, newStreak })

  const historyEntry = { date: todayKey, category: 'Daily Challenge', score: correct, total, pointsEarned }

  await updateDoc(doc(db, 'students', uid), {
    points: increment(pointsEarned),
    streak: newStreak,
    longestStreak: newLongest,
    lastPlayedDate: todayKey,
    history: arrayUnion(historyEntry),
    'dailyChallenge.lastCompletedDate': todayKey,
    ...(newBadges.length ? { badges: arrayUnion(...newBadges) } : {})
  })

  return { pointsEarned, bonus, newStreak, newBadges }
}

const GAME_DAILY_XP = 15 // flat XP for the first time you play a given game each day

// Called when a mini-game session ends (Snake game-over, a completed
// Tic-Tac-Toe round, etc). Awards a flat daily XP bonus the FIRST time this
// specific game is played today (prevents replaying the same easy game on
// loop just to farm points), and always updates the player's personal best
// score for that game so it can be shown on their profile.
// Pass compare: 'max' for score-type games (higher is better, e.g. Snake),
// or 'min' for time/moves-type games (lower is better, e.g. reaction time).
export async function recordGameResult(uid, profile, { gameId, score, compare = 'max' }) {
  const todayKey = new Date().toDateString()
  const games = profile.games || {}
  const prev = games[gameId] || { best: null, lastPlayedDate: null }

  const alreadyEarnedToday = prev.lastPlayedDate === todayKey
  const pointsEarned = alreadyEarnedToday ? 0 : GAME_DAILY_XP
  const isNewBest = prev.best == null
    ? true
    : compare === 'max' ? score > prev.best : score < prev.best

  await updateDoc(doc(db, 'students', uid), {
    points: increment(pointsEarned),
    [`games.${gameId}`]: {
      best: isNewBest ? score : prev.best,
      lastPlayedDate: todayKey
    }
  })

  return { pointsEarned, isNewBest }
}

export async function claimMysteryReward(uid, reward) {
  const changes = reward.type === 'streakFreeze'
    ? { streakFreezes: increment(1) }
    : { points: increment(reward.amount) }

  await updateDoc(doc(db, 'students', uid), changes)
  return reward
}
