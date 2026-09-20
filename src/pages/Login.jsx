import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const AVATARS = ['🦊', '🐼', '🐸', '🦁', '🐨', '🦄', '🐯', '🐵']

// One screen handles both signup and login — toggled with a tab, common on mobile apps.
export default function Login() {
  const { signup, login } = useAuth()
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
    </div>
  )
}

function friendlyError(code) {
  const map = {
    'auth/email-already-in-use': 'That email is already registered — try logging in instead.',
    'auth/invalid-email': 'That email looks invalid.',
    'auth/weak-password': 'Password should be at least 6 characters.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/user-not-found': 'No account found with that email.'
  }
  return map[code] || 'Something went wrong. Please try again.'
}
