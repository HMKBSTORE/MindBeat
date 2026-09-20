export default function Footer() {
  return (
    <footer className="border-t border-violet-light/70 px-5 py-5 text-center text-xs font-semibold text-ink/45">
      <span>Made with <span className="text-coral" aria-label="love">❤️</span> for Students</span>
      <span className="mx-2 text-ink/20">|</span>
      <span>© 2026 MindBeat Inc.</span>
      <span className="mx-2 text-ink/20">|</span>
      <a href="#privacy" className="hover:text-violet transition-colors">Privacy Policy</a>
      <span className="mx-2 text-ink/20">|</span>
      <a href="mailto:support@mindbeat.app" className="hover:text-violet transition-colors">Contact Support</a>
    </footer>
  )
}