import { Link } from 'react-router-dom'

export default function PublicHome() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-10 text-center">
        <div className="mb-3 text-5xl" aria-hidden="true">🧠⚡</div>
        <h1 className="display text-3xl font-extrabold text-violet sm:text-4xl">MindBeat: Online Quizzes, MCQs &amp; Games</h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-ink/60">
          Play online MCQ quizzes and daily trivia, earn XP, and explore casual browser games including MindBeat Battle and a 3D cube puzzle.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/mcq-quiz" className="btn-primary text-center">Browse MCQ quizzes</Link>
          <Link to="/games" className="btn-secondary text-center">Explore browser games</Link>
        </div>
      </header>

      <div className="space-y-7">
        <section>
          <h2 className="display text-xl font-extrabold">Play online MCQ quizzes</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Choose from general knowledge, logic, flags, school topics, and more. Each round is a short multiple-choice quiz for a quick trivia break.
          </p>
          <Link to="/mcq-quiz" className="mt-2 inline-flex font-bold text-violet underline">Browse quiz categories</Link>
        </section>
        <section>
          <h2 className="display text-xl font-extrabold">Take a daily quiz challenge</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Take the daily mixed-category challenge and return to see how your quiz practice is progressing.
          </p>
          <Link to="/login" className="mt-2 inline-flex font-bold text-violet underline">Sign in to play today’s challenge</Link>
        </section>
        <section>
          <h2 className="display text-xl font-extrabold">Earn XP and climb the leaderboard</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Completed quizzes add XP to your score. Sign in to compare your progress on the MindBeat leaderboard.
          </p>
          <Link to="/login" className="mt-2 inline-flex font-bold text-violet underline">Sign in to view your rank</Link>
        </section>
        <section>
          <h2 className="display text-xl font-extrabold">Play 3D browser games</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Solve the timed 3D Cube puzzle or collect stars and face the boss in MindBeat Battle, a five-level browser action game.
          </p>
          <Link to="/games" className="mt-2 inline-flex font-bold text-violet underline">Browse all games</Link>
        </section>
      </div>

    </main>
  )
}
