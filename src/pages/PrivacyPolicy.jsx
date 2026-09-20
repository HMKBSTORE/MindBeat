import { Link } from 'react-router-dom'
import { ArrowLeft, ShieldCheck } from 'lucide-react'

export default function PrivacyPolicy() {
  return (
    <main className="min-h-screen bg-paper px-5 py-8">
      <article className="mx-auto max-w-2xl">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-violet hover:text-violet-dark">
          <ArrowLeft size={17} /> Back to MindBeat
        </Link>
        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-mint/15 text-mint"><ShieldCheck size={28} /></div>
          <div>
            <p className="text-sm font-bold uppercase tracking-wide text-violet">MindBeat</p>
            <h1 className="text-3xl font-extrabold">Privacy Policy</h1>
          </div>
        </div>
        <div className="space-y-6 text-sm font-medium leading-7 text-ink/70">
          <p><strong className="text-ink">Last updated: September 20, 2026.</strong> This policy explains how MindBeat handles information when students use our educational quiz and gaming platform.</p>
          <Section title="Information we collect"><p>When you create an account, we collect the name, email address, avatar, progress, points, streaks, quiz history, and game scores you choose to provide. We also receive basic technical information needed to keep the service secure and functional.</p></Section>
          <Section title="How we use information"><p>We use this information to authenticate accounts, save learning progress, calculate rewards and leaderboards, provide support, prevent abuse, and improve MindBeat. We do not sell student personal information.</p></Section>
          <Section title="Firebase and account security"><p>MindBeat uses Firebase Authentication and Cloud Firestore. Firebase helps us protect sign-in credentials and store profile data using managed security controls. Passwords are handled by Firebase Authentication and are not stored in MindBeat's application database. No online service can promise absolute security, so please use a unique password and contact us if you notice suspicious activity.</p></Section>
          <Section title="Third-party advertising"><p>MindBeat may use third-party advertising services to help support the platform. These providers may use cookies, device identifiers, or similar technologies to serve and measure ads according to their own policies. We aim to use age-appropriate advertising and do not knowingly request sensitive student information for advertising personalization. Browser and device settings may offer controls for cookies and personalized ads.</p></Section>
          <Section title="Retention and choices"><p>We retain account information while your account is active or as needed to provide the service. You may request access, correction, or deletion of your account information by contacting support. Some records may be retained when required for security, fraud prevention, or legal obligations.</p></Section>
          <Section title="Children and student safety"><p>MindBeat is designed for students. Parents, guardians, or school administrators who have questions about a student's account or data should contact us so we can review the request appropriately.</p></Section>
          <Section title="Changes and contact"><p>We may update this policy as MindBeat evolves. Material changes will be reflected on this page. For privacy questions, use our <Link to="/contact-support" className="font-bold text-violet hover:text-violet-dark">Contact Support</Link> page.</p></Section>
        </div>
      </article>
    </main>
  )
}

function Section({ title, children }) {
  return <section><h2 className="mb-1 font-display text-xl font-extrabold text-ink">{title}</h2>{children}</section>
}
