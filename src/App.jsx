import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Loader from './components/Loader'
import Footer from './components/Footer'
import { GlobalAdScript } from './components/AdScript'

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
import PrivacyPolicy from './pages/PrivacyPolicy'
import ContactSupport from './pages/ContactSupport'
import CubeGame from './pages/CubeGame'
import PublicHome from './pages/PublicHome'

const SEO_PAGES = {
  '/': {
    title: 'MindBeat — Online Quizzes, Trivia & Games',
    description: 'Play online quizzes and trivia challenges, earn XP, climb the leaderboard, and enjoy casual games including a 3D cube puzzle.',
  },
  '/games/the-cube': {
    title: '3D Cube Puzzle Game — MindBeat',
    description: 'Play MindBeat’s 3D cube puzzle: rotate the cube, solve the scramble, and track your time in this browser-based casual game.',
  },
  '/privacy-policy': {
    title: 'Privacy Policy — MindBeat',
    description: 'Read how MindBeat handles account, progress, and technical information when you use its online quiz and gaming platform.',
  },
  '/contact-support': {
    title: 'Contact MindBeat Support',
    description: 'Contact MindBeat support for help with your account, quiz progress, rewards, or technical issues.',
  },
}

function PageSeo({ pathname, user }) {
  useEffect(() => {
    const pageConfig = SEO_PAGES[pathname]
    const isIndexable = pageConfig && (!user || pathname === '/privacy-policy' || pathname === '/contact-support')
    const page = isIndexable ? pageConfig : { title: 'MindBeat', description: 'MindBeat online quizzes and casual games.' }
    const canonicalUrl = isIndexable ? `https://mindbeat.online${pathname === '/' ? '/' : pathname}` : null

    document.title = page.title
    setMeta('name', 'description', page.description)
    setMeta('name', 'robots', isIndexable ? 'index,follow' : 'noindex,nofollow')
    setMeta('property', 'og:title', page.title)
    setMeta('property', 'og:description', page.description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('name', 'twitter:title', page.title)
    setMeta('name', 'twitter:description', page.description)

    let canonical = document.querySelector('link[rel="canonical"]')
    if (canonicalUrl) {
      if (!canonical) {
        canonical = document.createElement('link')
        canonical.rel = 'canonical'
        document.head.appendChild(canonical)
      }
      canonical.href = canonicalUrl
    } else {
      canonical?.remove()
    }
  }, [pathname, user])

  return null
}

function setMeta(attribute, key, value) {
  let element = document.querySelector(`meta[${attribute}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attribute, key)
    document.head.appendChild(element)
  }
  if (value) element.content = value
  else element.remove()
}

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
      <>
        <GlobalAdScript src="https://pl31429572.profitableratecpmnetwork.com/8f/d3/4f/8fd34fe714e421b3268826a08079f70d.js" />
        <PageSeo pathname={location.pathname} user={user} />
        <Routes>
          <Route path="/" element={<PublicHome />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/contact-support" element={<ContactSupport />} />
          <Route path="/games/the-cube" element={<CubeGame />} />
          <Route path="/login" element={<Login />} />
          <Route path="*" element={<Login />} />
        </Routes>
      </>
    )
  }

  // Hide the bottom nav on full-screen flows like an active quiz — keeps focus on the question.
  const hideNav = ['/quiz/', '/challenge/', '/games/', '/daily-challenge'].some((p) => location.pathname.startsWith(p)) && location.pathname !== '/challenge'

  return (
    <div className={hideNav ? '' : 'pb-16'}>
      <GlobalAdScript src="https://pl31429572.profitableratecpmnetwork.com/8f/d3/4f/8fd34fe714e421b3268826a08079f70d.js" />
      <PageSeo pathname={location.pathname} user={user} />
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
        <Route path="/games/the-cube" element={<CubeGame />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {!hideNav && <BottomNav />}
      {!hideNav && <Footer />}
    </div>
  )
}
