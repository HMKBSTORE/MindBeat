import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import questionBank from '../data/questions.json'

const colorMap = { violet: 'bg-violet', mint: 'bg-mint', sun: 'bg-sun', coral: 'bg-coral' }

export default function McqHub() {
  const { user } = useAuth()

  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-9">
        <p className="mb-2 text-sm font-bold uppercase tracking-wide text-violet">MindBeat Quizzes</p>
        <h1 className="display text-3xl font-extrabold text-ink sm:text-4xl">Online MCQ Quizzes &amp; Daily Trivia</h1>
        <p className="mt-3 max-w-xl font-medium leading-7 text-ink/60">
          Pick a multiple-choice quiz category, answer a short round of questions, and track your XP. Sign in to play and save your progress.
        </p>
      </header>

      <section aria-labelledby="mcq-categories-heading">
        <h2 id="mcq-categories-heading" className="mb-4 display text-xl font-extrabold">Browse quiz categories</h2>
        <ul className="grid list-none grid-cols-2 gap-3 p-0">
          {questionBank.categories.map((category) => (
            <li key={category.id} id={category.id}>
              <Link
                to={user ? `/quiz/${category.id}` : '/login'}
                className={`${colorMap[category.color]} tap-scale flex min-h-32 h-full flex-col justify-between rounded-3xl p-4 text-white shadow-sm`}
              >
                <span className="text-3xl" aria-hidden="true">{category.emoji}</span>
                <span className="font-display font-bold leading-tight">{category.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="display text-xl font-extrabold">Daily quiz challenge</h2>
        <p className="mt-2 font-medium leading-7 text-ink/60">
          MindBeat also offers a daily mixed-category quiz challenge. Sign in to take part, keep your streak, and compare your quiz XP on the leaderboard.
        </p>
        <Link to={user ? '/daily-challenge' : '/login'} className="btn-primary mt-4 inline-flex text-center">
          {user ? 'Play today’s challenge' : 'Open MindBeat'}
        </Link>
      </section>

      <p className="mt-8 text-sm font-medium leading-6 text-ink/55">
        Looking for something different? Explore <Link to="/games" className="font-bold text-violet underline">MindBeat browser games</Link>.
      </p>
    </main>
  )
}
