import { Link } from 'react-router-dom'
import games from '../data/games'

const colorMap = { violet: 'bg-violet', coral: 'bg-coral' }

export default function GamesHub() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-violet">MindBeat Games</p>
        <h1 className="display text-3xl font-extrabold text-ink sm:text-4xl">Free 3D Browser Games</h1>
        <p className="mt-3 max-w-xl font-medium leading-7 text-ink/60">
          Play casual games in your browser, from a timed 3D cube puzzle to a five-level action arena. Choose a game to start.
        </p>
      </header>

      <section aria-labelledby="games-heading">
        <h2 id="games-heading" className="mb-4 display text-xl font-extrabold">Choose a game</h2>
        <ul className="grid list-none grid-cols-1 gap-4 p-0 sm:grid-cols-2">
          {games.map((game) => (
            <li key={game.id}>
              <Link
                to={game.path}
                className={`${colorMap[game.color]} tap-scale flex min-h-44 h-full flex-col rounded-3xl p-5 text-left text-white shadow-sm`}
              >
                <span className="mb-5 text-4xl" aria-hidden="true">{game.emoji}</span>
                <h3 className="font-display text-lg font-extrabold">{game.label}</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-white/85">{game.description}</p>
                <span className="mt-auto pt-4 text-sm font-bold">Play {game.label} <span aria-hidden="true">→</span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <p className="mt-8 text-sm font-medium leading-6 text-ink/55">
        Prefer question games? Browse the <Link to="/mcq-quiz" className="font-bold text-violet underline">online MCQ quizzes</Link>.
      </p>
    </main>
  )
}
