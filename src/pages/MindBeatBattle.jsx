import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function MindBeatBattle() {
  const { user } = useAuth()

  return (
    <main className="fixed inset-0 z-50 bg-[#0d0e15]">
      <div className="absolute left-4 top-4 z-10">
        <Link
          to={user ? '/play' : '/'}
          className="inline-flex items-center rounded-full bg-black/50 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/70"
        >
          Back to games
        </Link>
      </div>
      <iframe
        title="MindBeat Battle 3D game"
        src="/games/mindbeat_battle.html"
        className="h-full w-full border-0"
        allow="fullscreen"
      />
    </main>
  )
}