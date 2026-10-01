import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { lazy, Suspense, useEffect, useState } from 'react'
import { useAuth } from './context/AuthContext'
import BottomNav from './components/BottomNav'
import Loader from './components/Loader'
import Footer from './components/Footer'
import { GlobalAdScript } from './components/AdScript'
import PrivacyPolicy from './pages/PrivacyPolicy'
import ContactSupport from './pages/ContactSupport'
import PublicHome from './pages/PublicHome'
import GamesHub from './pages/GamesHub'
import McqHub from './pages/McqHub'
import games from './data/games'
import questionBank from './data/questions.json'

const Login = lazy(() => import('./pages/Login'))
const Home = lazy(() => import('./pages/Home'))
const Play = lazy(() => import('./pages/Play'))
const Quiz = lazy(() => import('./pages/Quiz'))
const DailyChallenge = lazy(() => import('./pages/DailyChallenge'))
const Leaderboard = lazy(() => import('./pages/Leaderboard'))
const Profile = lazy(() => import('./pages/Profile'))
const PublicProfile = lazy(() => import('./pages/PublicProfile'))
const Challenge = lazy(() => import('./pages/Challenge'))
const ChallengePlay = lazy(() => import('./pages/ChallengePlay'))
const Admin = lazy(() => import('./pages/Admin'))
const CubeGame = lazy(() => import('./pages/CubeGame'))
const MindBeatBattle = lazy(() => import('./pages/MindBeatBattle'))

const SEO_PAGES = {
  '/': {
    title: 'MindBeat | Free Online Quizzes, MCQs & Games',
    description: 'Play free online quizzes and MCQs, take daily challenges, earn XP, and explore browser games like MindBeat Battle and the 3D Cube.',
  },
  '/games': {
    title: 'Free 3D Browser Games | MindBeat',
    description: 'Play MindBeat’s free browser games: solve the 3D Cube puzzle or collect stars and battle arena chasers in MindBeat Battle.',
  },
  '/mcq-quiz': {
    title: 'Online MCQ Quizzes & Daily Trivia | MindBeat',
    description: 'Practice multiple-choice quizzes in general knowledge, logic, flags, school topics, and more. Take a daily quiz and track your XP.',
  },
  '/games/the-cube': {
    title: '3D Cube Puzzle Game — MindBeat',
    description: 'Play MindBeat’s 3D cube puzzle: rotate the cube, solve the scramble, and track your time in this browser-based casual game.',
  },
  '/games/mindbeat-battle': {
    title: 'MindBeat Battle — Free 3D Browser Game',
    description: 'Play MindBeat Battle, a 3D browser action game. Collect stars, avoid arena chasers, use power-ups, and face the boss across five levels.',
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
    const publicContentPaths = ['/games', '/mcq-quiz', '/games/the-cube', '/games/mindbeat-battle', '/privacy-policy', '/contact-support']
    const isIndexable = pageConfig && (!user || publicContentPaths.includes(pathname))
    const page = isIndexable ? pageConfig : { title: 'MindBeat', description: 'MindBeat online quizzes and casual games.' }
    const canonicalUrl = isIndexable ? `https://mindbeat.online${pathname === '/' ? '/' : pathname}` : null

    document.title = page.title
    setMeta('name', 'description', page.description)
    setMeta('name', 'robots', isIndexable ? 'index,follow' : 'noindex,nofollow')
    setMeta('property', 'og:title', page.title)
    setMeta('property', 'og:description', page.description)
    setMeta('property', 'og:url', canonicalUrl)
    setMeta('property', 'og:image', 'https://mindbeat.online/icon-512.png')
    setMeta('property', 'og:image:alt', 'MindBeat app icon')
    setMeta('name', 'twitter:card', 'summary')
    setMeta('name', 'twitter:title', page.title)
    setMeta('name', 'twitter:description', page.description)
    setMeta('name', 'twitter:image', 'https://mindbeat.online/icon-512.png')

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

    updateStructuredData(pathname, canonicalUrl)
  }, [pathname, user])

  return null
}

function updateStructuredData(pathname, canonicalUrl) {
  const existing = document.getElementById('mindbeat-route-schema')
  if (!canonicalUrl) {
    existing?.remove()
    return
  }

  const organization = {
    '@type': 'Organization',
    '@id': 'https://mindbeat.online/#organization',
    name: 'MindBeat',
    url: 'https://mindbeat.online/',
    logo: 'https://mindbeat.online/icon-512.png',
  }
  const website = {
    '@type': 'WebSite',
    '@id': 'https://mindbeat.online/#website',
    name: 'MindBeat',
    url: 'https://mindbeat.online/',
    publisher: { '@id': organization['@id'] },
  }
  const graph = [organization, website]

  if (pathname === '/') {
    graph.push(
      {
        '@type': 'WebApplication',
        '@id': 'https://mindbeat.online/#application',
        name: 'MindBeat',
        url: 'https://mindbeat.online/',
        applicationCategory: 'GameApplication',
        operatingSystem: 'Any',
        browserRequirements: 'Requires JavaScript and a modern web browser.',
        description: SEO_PAGES['/'].description,
        publisher: { '@id': organization['@id'] },
        featureList: ['Online MCQ quizzes', 'Daily quiz challenges', 'XP leaderboard', '3D cube puzzle', 'MindBeat Battle'],
      },
      { '@type': 'WebPage', '@id': canonicalUrl, url: canonicalUrl, name: SEO_PAGES['/'].title, isPartOf: { '@id': website['@id'] } },
    )
  } else if (pathname === '/games' || pathname === '/mcq-quiz') {
    const isGamesPage = pathname === '/games'
    const listItems = (isGamesPage ? games : questionBank.categories).map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: isGamesPage ? item.label : item.label,
      url: isGamesPage
        ? `https://mindbeat.online${item.path}`
        : `${canonicalUrl}#${item.id}`,
    }))
    graph.push({
      '@type': 'CollectionPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: SEO_PAGES[pathname].title,
      description: SEO_PAGES[pathname].description,
      isPartOf: { '@id': website['@id'] },
      mainEntity: { '@type': 'ItemList', itemListElement: listItems },
    })
    if (isGamesPage) {
      games.forEach((game) => graph.push(videoGameSchema(game)))
    }
  } else if (pathname === '/games/the-cube' || pathname === '/games/mindbeat-battle') {
    const game = games.find((item) => item.path === pathname)
    graph.push({
      '@type': 'WebPage',
      '@id': canonicalUrl,
      url: canonicalUrl,
      name: SEO_PAGES[pathname].title,
      description: SEO_PAGES[pathname].description,
      isPartOf: { '@id': website['@id'] },
      mainEntity: videoGameSchema(game),
    })
  } else {
    graph.push({ '@type': 'WebPage', '@id': canonicalUrl, url: canonicalUrl, name: SEO_PAGES[pathname].title, isPartOf: { '@id': website['@id'] } })
  }

  let script = existing
  if (!script) {
    script = document.createElement('script')
    script.id = 'mindbeat-route-schema'
    script.type = 'application/ld+json'
    document.head.appendChild(script)
  }
  script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': graph })
}

function videoGameSchema(game) {
  return {
    '@type': 'VideoGame',
    '@id': `https://mindbeat.online${game.path}#game`,
    name: game.label,
    url: `https://mindbeat.online${game.path}`,
    description: game.description,
    gamePlatform: 'Web browser',
    playMode: 'SinglePlayer',
    genre: game.genre,
    publisher: { '@id': 'https://mindbeat.online/#organization' },
  }
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
      <div className="flex min-h-screen flex-col">
        <GlobalAdScript src="https://pl31429572.profitableratecpmnetwork.com/8f/d3/4f/8fd34fe714e421b3268826a08079f70d.js" />
        <PageSeo pathname={location.pathname} user={user} />
        <div className="flex-1">
          <Suspense fallback={<Loader label="Loading page..." />}>
          <Routes>
            <Route path="/" element={<PublicHome />} />
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/contact-support" element={<ContactSupport />} />
            <Route path="/games" element={<GamesHub />} />
            <Route path="/mcq-quiz" element={<McqHub />} />
            <Route path="/games/the-cube" element={<CubeGame />} />
            <Route path="/games/mindbeat-battle" element={<MindBeatBattle />} />
            <Route path="/login" element={<Login />} />
            <Route path="*" element={<Login />} />
          </Routes>
          </Suspense>
        </div>
        {['/', '/games', '/mcq-quiz', '/privacy-policy', '/contact-support'].includes(location.pathname) && <Footer />}
      </div>
    )
  }

  // Hide the bottom nav on full-screen flows like an active quiz — keeps focus on the question.
  const hideNav = ['/quiz/', '/challenge/', '/games/', '/daily-challenge'].some((p) => location.pathname.startsWith(p)) && location.pathname !== '/challenge'

  return (
    <div className={hideNav ? '' : 'pb-16'}>
      <GlobalAdScript src="https://pl31429572.profitableratecpmnetwork.com/8f/d3/4f/8fd34fe714e421b3268826a08079f70d.js" />
      <PageSeo pathname={location.pathname} user={user} />
      <Suspense fallback={<Loader label="Loading page..." />}>
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
        <Route path="/games" element={<GamesHub />} />
        <Route path="/mcq-quiz" element={<McqHub />} />
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
        <Route path="/games/mindbeat-battle" element={<MindBeatBattle />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </Suspense>
      {!hideNav && <BottomNav />}
      {!hideNav && <Footer />}
    </div>
  )
}
