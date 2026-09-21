import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐨', '🦄', '🐯', '🐵']

// One screen handles both signup and login — toggled with a tab, common on mobile apps.
export default function Login() {
  const { signup, login, signInWithGoogle } = useAuth()
  const navigate = useNavigate()
  const [mode, setMode] = useState('signup')
  const [form, setForm] = useState({
    name: '', avatar: AVATARS[0], email: '', password: ''
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        await signup(form)
      } else {
        await login(form)
      }
      navigate('/')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setBusy(false)
    }
  }

  async function handleGoogleSignIn() {
    setError('')
    setBusy(true)
    try {
      await signInWithGoogle()
      navigate('/')
    } catch (err) {
      setError(friendlyError(err.code))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col justify-center px-6 py-10 max-w-md mx-auto">
      <div className="text-center mb-8">
        <div className="text-5xl mb-2">🧠⚡</div>
        <h1 className="display text-4xl font-extrabold text-violet">MindBeat</h1>
        <p className="text-ink/50 font-medium mt-1">Quiz. Compete. Beat your friends.</p>
      </div>

      <div className="flex bg-violet-light rounded-full p-1 mb-6">
        {['signup', 'login'].map((m) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2.5 rounded-full font-display font-semibold text-sm transition-colors ${
              mode === m ? 'bg-violet text-white' : 'text-violet/70'
            }`}
          >
            {m === 'signup' ? 'New Player' : 'Log In'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        {mode === 'signup' && (
          <>
            <div>
              <label className="text-sm font-semibold text-ink/70">Pick your avatar</label>
              <div className="flex gap-2 mt-2 flex-wrap">
                {AVATARS.map((a) => (
                  <button
                    type="button"
                    key={a}
                    onClick={() => update('avatar', a)}
                    className={`text-2xl w-12 h-12 rounded-2xl flex items-center justify-center tap-scale ${
                      form.avatar === a ? 'bg-violet text-white' : 'bg-white border-2 border-violet-light'
                    }`}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>

            <input
              required
              placeholder="Full name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              className="input"
            />

          </>
        )}

        <input
          required
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => update('email', e.target.value)}
          className="input"
        />
        <input
          required
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => update('password', e.target.value)}
          className="input"
          minLength={6}
        />

        {error && <p className="text-coral text-sm font-medium text-center">{error}</p>}

        <button type="submit" disabled={busy} className="btn-primary mt-2">
          {busy ? 'Please wait...' : mode === 'signup' ? "Let's Go 🚀" : 'Log In'}
        </button>
      </form>

      <div className="my-5 flex items-center gap-3 text-xs font-bold uppercase tracking-wide text-ink/35">
        <span className="h-px flex-1 bg-violet-light" />
        <span>or</span>
        <span className="h-px flex-1 bg-violet-light" />
      </div>
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        className="flex w-full items-center justify-center gap-3 rounded-full border-2 border-violet-light bg-white px-6 py-3.5 font-display text-base font-bold text-ink shadow-sm transition-all hover:-translate-y-0.5 hover:border-violet/30 active:translate-y-0 disabled:opacity-50"
      >
        <GoogleIcon />
        {busy ? 'Connecting...' : 'Sign in with Google'}
      </button>
    </div>
  )
}

function GoogleIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
      <path fill="#4285F4" d="M21.35 12.23c0-.73-.07-1.43-.22-2.1H12v3.98h5.24a4.48 4.48 0 0 1-1.94 2.94v2.45h3.14c1.84-1.7 2.91-4.2 2.91-7.27Z" />
      <path fill="#34A853" d="M12 21.6c2.63 0 4.84-.87 6.45-2.35l-3.14-2.45c-.87.58-1.98.92-3.31.92-2.54 0-4.69-1.72-5.46-4.03H3.3v2.53A9.74 9.74 0 0 0 12 21.6Z" />
      <path fill="#FBBC05" d="M6.54 13.69A5.85 5.85 0 0 1 6.23 12c0-.59.1-1.17.31-1.69V7.78H3.3A9.74 9.74 0 0 0 2.27 12c0 1.53.37 2.98 1.03 4.22l3.24-2.53Z" />
      <path fill="#EA4335" d="M12 6.28c1.43 0 2.71.49 3.72 1.45l2.79-2.79C16.84 3.38 14.63 2.4 12 2.4a9.74 9.74 0 0 0-8.7 5.38l3.24 2.53c.77-2.31 2.92-4.03 5.46-4.03Z" />
    </svg>
  )
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered — try logging in instead.',
    'auth/invalid-email': 'That email looks invalid.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with that email.',
    'auth/popup-closed-by-user': 'The Google sign-in window was closed.',
    'auth/popup-blocked': 'Your browser blocked the Google sign-in window. Please allow popups and try again.'
  }
  return map[code] || 'Something went wrong. Please try again.'
}
