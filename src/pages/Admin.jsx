import { useEffect, useState } from 'react'
import { addDoc, collection, deleteDoc, doc, getDocs } from 'firebase/firestore'
import { db, ADMIN_EMAIL } from '../firebase'
import { useAuth } from '../context/AuthContext'
import { Trash2 } from 'lucide-react'
import questionBank from '../data/questions.json'

const EMPTY = { category: 'gk', subject: '', class: '', question: '', options: ['', '', '', ''], answer: 0 }

// Only reachable at /admin. Not linked from the bottom nav — bookmark the
// URL on your own device after logging in with your admin account.
export default function Admin() {
  const { user } = useAuth()
  const [form, setForm] = useState(EMPTY)
  const [status, setStatus] = useState('')
  const [firestoreQuestions, setFirestoreQuestions] = useState(null)
  const [filterCategory, setFilterCategory] = useState('all')

  const isTrueFalse = form.category === 'truefalse'

  useEffect(() => {
    if (user?.email === ADMIN_EMAIL) loadQuestions()
  }, [user])

  async function loadQuestions() {
    const snap = await getDocs(collection(db, 'questions'))
    setFirestoreQuestions(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  }

  if (!user || user.email !== ADMIN_EMAIL) {
    return (
      <div className="max-w-md mx-auto px-5 pt-20 text-center">
        <p className="text-4xl mb-3">🔒</p>
        <p className="font-semibold text-ink/70">
          This page is only for the admin account.
          <br />Log in with the email set as ADMIN_EMAIL in firebase.js.
        </p>
      </div>
    )
  }

  function updateOption(i, value) {
    const options = [...form.options]
    options[i] = value
    setForm({ ...form, options })
  }

  function handleCategoryChange(categoryId) {
    if (categoryId === 'truefalse') {
      setForm({ ...EMPTY, category: categoryId, options: ['True', 'False'] })
    } else {
      setForm({ ...EMPTY, category: categoryId })
    }
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setStatus('')
    if (form.options.some((o) => !o.trim()) || !form.question.trim()) {
      setStatus('Fill in the question and all options.')
      return
    }
    await addDoc(collection(db, 'questions'), form)
    setStatus('Question added! ✅')
    handleCategoryChange(form.category)
    loadQuestions()
  }

  async function handleDelete(id) {
    if (!confirm('Delete this question? This cannot be undone.')) return
    await deleteDoc(doc(db, 'questions', id))
    setFirestoreQuestions((qs) => qs.filter((q) => q.id !== id))
  }

  // Combine the built-in starter questions (from questions.json, always in the app,
  // can't be deleted here — edit questions.json in VS Code for those) with the
  // Firestore ones you've added/can delete — so this list matches what students
  // actually see when they play, not just the Firestore-only subset.
  const allQuestions = [
    ...questionBank.questions.map((q) => ({ ...q, isLocal: true })),
    ...(firestoreQuestions || [])
  ]
  const visibleQuestions = firestoreQuestions === null ? null : allQuestions.filter(
    (q) => filterCategory === 'all' || q.category === filterCategory
  )

  return (
    <div className="max-w-md mx-auto px-5 pt-8 pb-16">
      <h1 className="text-2xl font-extrabold display mb-1">Admin</h1>
      <p className="text-ink/50 font-medium mb-5">Add and manage the live quiz question bank.</p>

      <h2 className="font-bold text-ink/60 text-sm uppercase tracking-wide mb-2">Add a Question</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 mb-8">
        <select className="input" value={form.category} onChange={(e) => handleCategoryChange(e.target.value)}>
          {questionBank.categories.map((c) => (
            <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
          ))}
        </select>

        {form.category === 'revision' && (
          <div className="flex gap-2">
            <input className="input" placeholder="Subject (e.g. Math)" value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })} />
            <input className="input" placeholder="Class (e.g. 9)" value={form.class}
              onChange={(e) => setForm({ ...form, class: e.target.value })} />
          </div>
        )}

        <textarea className="input" placeholder={
            form.category === 'flags' ? 'e.g. Which country does this flag belong to? 🇵🇰' : 'Question text'
          } rows={2}
          value={form.question} onChange={(e) => setForm({ ...form, question: e.target.value })} />

        {isTrueFalse ? (
          <div className="flex flex-col gap-2">
            {['True', 'False'].map((label, i) => (
              <label key={label} className="flex items-center gap-2 card py-3">
                <input type="radio" name="tf-correct" checked={form.answer === i}
                  onChange={() => setForm({ ...form, answer: i, options: ['True', 'False'] })}
                  className="w-5 h-5 accent-violet" />
                <span className="font-semibold">{label}{form.answer === i ? ' (correct)' : ''}</span>
              </label>
            ))}
          </div>
        ) : (
          form.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                type="radio"
                name="correct"
                checked={form.answer === i}
                onChange={() => setForm({ ...form, answer: i })}
                className="w-5 h-5 accent-violet shrink-0"
              />
              <input
                className="input"
                placeholder={`Option ${i + 1}${form.answer === i ? ' (correct)' : ''}`}
                value={opt}
                onChange={(e) => updateOption(i, e.target.value)}
              />
            </div>
          ))
        )}

        {status && <p className="text-sm font-medium text-center text-violet">{status}</p>}

        <button type="submit" className="btn-primary mt-2">Add Question</button>
      </form>

      <h2 className="font-bold text-ink/60 text-sm uppercase tracking-wide mb-2">
        Manage Questions {visibleQuestions ? `(${allQuestions.length})` : ''}
      </h2>

      <select className="input mb-3" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
        <option value="all">All categories</option>
        {questionBank.categories.map((c) => (
          <option key={c.id} value={c.id}>{c.emoji} {c.label}</option>
        ))}
      </select>

      {firestoreQuestions === null && <p className="text-ink/40 text-sm">Loading questions...</p>}

      <div className="flex flex-col gap-2">
        {visibleQuestions?.map((q) => (
          <div key={q.isLocal ? `local-${q.id}` : q.id} className="card flex items-start justify-between gap-2 py-3">
            <div className="min-w-0">
              <p className="text-xs text-ink/40 font-semibold mb-0.5">
                {questionBank.categories.find((c) => c.id === q.category)?.emoji}{' '}
                {questionBank.categories.find((c) => c.id === q.category)?.label || q.category}
                {q.isLocal && <span className="ml-2 bg-violet-light text-violet px-2 py-0.5 rounded-full">Built-in</span>}
              </p>
              <p className="text-sm font-semibold truncate">{q.question}</p>
              <p className="text-xs text-mint font-medium mt-0.5">✓ {q.options?.[q.answer]}</p>
            </div>
            {q.isLocal ? (
              <span className="text-ink/20 shrink-0 p-2 text-xs italic">code only</span>
            ) : (
              <button onClick={() => handleDelete(q.id)} className="text-coral tap-scale shrink-0 p-2">
                <Trash2 size={18} />
              </button>
            )}
          </div>
        ))}
        {visibleQuestions?.length === 0 && (
          <p className="text-ink/40 text-sm text-center py-6">No questions in this category yet.</p>
        )}
      </div>

      <p className="text-xs text-ink/30 mt-4">
        "Built-in" questions come from questions.json in the code — edit that file in
        VS Code to change or remove those. Everything else was added through this form
        and can be deleted with the trash icon.
      </p>
    </div>
  )
}
