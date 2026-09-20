import { NavLink } from 'react-router-dom'
import { Home, Swords, Trophy, User } from 'lucide-react'

const tabs = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/play', label: 'Play', icon: Swords },
  { to: '/leaderboard', label: 'Ranks', icon: Trophy },
  { to: '/profile', label: 'Profile', icon: User }
]

// Fixed bottom bar, always visible on mobile — this is the app's main navigation.
export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-violet-light
                     flex justify-around items-center h-16 px-2 z-40
                     pb-[env(safe-area-inset-bottom)]">
      {tabs.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center gap-0.5 w-16 h-full text-xs font-semibold tap-scale ${
              isActive ? 'text-violet' : 'text-ink/40'
            }`
          }
        >
          <Icon size={22} strokeWidth={2.4} />
          {label}
        </NavLink>
      ))}
    </nav>
  )
}
