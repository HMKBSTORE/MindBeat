import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Loader from './components/Loader'
import Footer from './components/Footer'

import Login from './pages/Login'
import Home from './pages/Home'
import Play from './pages/Play'
import Quiz from './pages/Quiz'
import DailyChallenge from './pages/DailyChallenge'
import Leaderboard from './pages/Leaderboard'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import Challenge from './pages/Challenge'
import ChallengePlay from './pages/ChallengePlay'
import Admin from './pages/Admin'
import Snake from './games/Snake'
import TicTacToe from './games/TicTacToe'
import MemoryMatch from './games/MemoryMatch'
import ReactionTest from './games/ReactionTest'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ContactSupport from './pages/ContactSupport'

export default function App() {
  const { user, loading } = useAuth()
  const location = useLocation()
  const [deferredInstallPrompt, setDeferredInstallPrompt] = useState(null)

  useEffect(() => {
    function captureInstallPrompt(event) {
      event.preventDefault()
      setDeferredInstallPrompt(event)
      console.info('[MindBeat] beforeinstallprompt captured')
    }

    window.addEventListener('beforeinstallprompt', captureInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', captureInstallPrompt)
  }, [])

  if (loading) return <Loader label="Waking up MindBeat..." />

  if (!user) {
    return (
      <Routes>
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Login />} />
      </Routes>
    )
  }

  // Hide the bottom nav on full-screen flows like an active quiz — keeps focus on the question.
  const hideNav = ['/quiz/', '/challenge/', '/games/', '/daily-challenge'].some((p) => location.pathname.startsWith(p)) && location.pathname !== '/challenge'

  return (
    <div className={hideNav ? '' : 'pb-16'}>
      <Routes>
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route
          path="/"
          element={
            <Home
              deferredInstallPrompt={deferredInstallPrompt}
              clearDeferredInstallPrompt={setDeferredInstallPrompt}
            />
          }
        />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/contact-support" element={<ContactSupport />} />
        <Route path="/play" element={<Play />} />
        <Route path="/quiz/:categoryId" element={<Quiz />} />
        <Route path="/daily-challenge" element={<DailyChallenge />} />
        <Route path="/leaderboard" element={<Leaderboard />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/student/:studentId" element={<PublicProfile />} />
        <Route path="/challenge" element={<Challenge />} />
        <Route path="/challenge/:challengeId" element={<ChallengePlay />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/games/snake" element={<Snake />} />
        <Route path="/games/tictactoe" element={<TicTacToe />} />
        <Route path="/games/memory" element={<MemoryMatch />} />
        <Route path="/games/reaction" element={<ReactionTest />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
      {!hideNav && <Footer />}
    </div>
  )
}
