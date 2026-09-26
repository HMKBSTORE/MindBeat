import { Link } from 'react-router-dom'

export default function PublicHome() {
  return (
    <main className="mx-auto max-w-2xl px-5 py-10 sm:py-14">
      <header className="mb-10 text-center">
        <div className="mb-3 text-5xl" aria-hidden="true">🧠⚡</div>
        <h1 className="display text-3xl font-extrabold text-violet sm:text-4xl">MindBeat — Online Quizzes &amp; Games</h1>
        <p className="mx-auto mt-3 max-w-xl text-base font-medium leading-7 text-ink/60">
          Put your knowledge to the test with online quizzes, trivia challenges, and casual games. Earn XP as you play and see how you rank.
        </p>
        <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
          <Link to="/login" className="btn-primary text-center">Play quizzes</Link>
          <Link to="/games/the-cube" className="btn-secondary text-center">Try the 3D cube puzzle</Link>
        </div>
      </header>

      <div className="space-y-7">
        <section>
          <h2 className="display text-xl font-extrabold">Play online quizzes and trivia</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Choose a quiz, answer a short set of questions, and take on quiz challenges across a range of topics. MindBeat is made for quick, enjoyable trivia sessions whenever you have a few minutes.
          </p>
        </section>
        <section>
          <h2 className="display text-xl font-extrabold">Earn XP and climb the leaderboard</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Playing quizzes earns XP that adds to your score. Compare your progress on the leaderboard and challenge yourself to improve with each round.
          </p>
        </section>
        <section>
          <h2 className="display text-xl font-extrabold">Take a break with casual games</h2>
          <p className="mt-2 font-medium leading-7 text-ink/60">
            Alongside quiz competition, MindBeat offers casual games including a 3D cube-solving puzzle. Rotate the cube, work through its scramble, and track your solve time in your browser.
          </p>
        </section>
      </div>

      <footer className="mt-10 flex justify-center gap-5 border-t border-violet-light pt-5 text-sm font-semibold text-violet">
        <Link to="/privacy-policy">Privacy Policy</Link>
        <Link to="/contact-support">Contact Support</Link>
      </footer>
    </main>
  )
}
