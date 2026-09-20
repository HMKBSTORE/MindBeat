import { Link } from 'react-router-dom'
import { ArrowLeft, Mail, MessageCircle } from 'lucide-react'

const SUPPORT_EMAIL = 'hussainmehdikhan709@gmail.com'

export default function ContactSupport() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-paper px-5 py-8">
      <section className="w-full max-w-md text-center">
        <Link to="/" className="mb-10 inline-flex items-center gap-2 text-sm font-bold text-violet hover:text-violet-dark">
          <ArrowLeft size={17} /> Back to MindBeat
        </Link>
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-3xl bg-coral/15 text-coral"><MessageCircle size={32} /></div>
        <p className="text-sm font-bold uppercase tracking-wide text-violet">MindBeat Support</p>
        <h1 className="mt-1 text-3xl font-extrabold">We are here to help</h1>
        <p className="mt-4 text-sm font-medium leading-7 text-ink/60">Have a question about your account, progress, rewards, or a technical issue? Send us a note and our team will get back to you.</p>
        <a href={`mailto:${SUPPORT_EMAIL}`} className="btn-primary mt-7 inline-flex w-full items-center justify-center gap-2">
          <Mail size={19} /> Email Support
        </a>
        <p className="mt-3 break-all text-xs font-semibold text-ink/45">{SUPPORT_EMAIL}</p>
      </section>
    </main>
  )
}
