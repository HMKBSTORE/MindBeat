import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'

const DISMISSED_KEY = 'mindbeat:install-prompt-dismissed-at'
const DISMISS_COOLDOWN = 7 * 24 * 60 * 60 * 1000

export default function InstallPrompt({ deferredInstallPrompt, clearDeferredInstallPrompt }) {
  const [visible, setVisible] = useState(false)
  const [safariHelp, setSafariHelp] = useState(false)
  const [installing, setInstalling] = useState(false)
  const [fallbackMessage, setFallbackMessage] = useState('')

  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone
    const dismissedAt = Number(localStorage.getItem(DISMISSED_KEY) || 0)
    if (isStandalone || Date.now() - dismissedAt < DISMISS_COOLDOWN) return undefined

    const timer = window.setTimeout(() => setVisible(true), 5000)

    function handleInstalled() {
      setVisible(false)
      clearDeferredInstallPrompt?.()
    }

    window.addEventListener('appinstalled', handleInstalled)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('appinstalled', handleInstalled)
    }
  }, [clearDeferredInstallPrompt])

  function maybeLater() {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  function showFallback() {
    console.warn('[MindBeat] Native install prompt was unavailable or rejected.')
    setSafariHelp(true)
    setFallbackMessage('Please click the 3-dots menu on your browser browser and select Add to Home Screen manually to install!')
    window.setTimeout(() => setFallbackMessage(''), 2000)
  }

  async function install() {
    if (installing) return
    const promptEvent = deferredInstallPrompt
    setInstalling(true)

    try {
      if (!promptEvent || typeof promptEvent.prompt !== 'function') {
        showFallback()
        return
      }

      await promptEvent.prompt()
      const choice = await promptEvent.userChoice
      console.info('[MindBeat] Install prompt result:', choice?.outcome || 'unknown')
      if (choice?.outcome === 'accepted') setVisible(false)
      else showFallback()
    } catch (error) {
      console.warn('[MindBeat] Native install prompt failed.', error)
      showFallback()
    } finally {
      clearDeferredInstallPrompt?.()
      setInstalling(false)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-4 bottom-20 z-50 mx-auto max-w-md animate-[slide-up_350ms_ease-out]" role="dialog" aria-label="Install MindBeat">
      <div className="rounded-3xl border-2 border-violet-light bg-white p-5 shadow-[0_18px_50px_rgba(30,27,46,0.18)]">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-violet-light text-3xl">🦊</div>
          <div className="min-w-0 flex-1">
            <div className="flex items-start justify-between gap-2">
              <h2 className="font-display text-xl font-extrabold text-ink">Take MindBeat with you</h2>
              <button onClick={maybeLater} className="rounded-full p-1 text-ink/40 transition-colors hover:bg-violet-light hover:text-ink" aria-label="Close install prompt">
                <X size={18} />
              </button>
            </div>
            <p className="mt-1 text-sm font-medium leading-relaxed text-ink/55">Practice anywhere with a quick shortcut on your home screen.</p>
          </div>
        </div>
        <div className="mt-4 flex gap-3">
          <button onClick={maybeLater} className="btn-secondary flex-1 px-4 py-3 text-sm">Maybe Later</button>
          <button onClick={install} disabled={installing} className="btn-primary flex-1 px-4 py-3 text-sm"><Download size={17} className="mr-1 inline" /> {installing ? 'Opening...' : 'Install'}</button>
        </div>
        {safariHelp && <p className="mt-3 rounded-xl bg-sun/15 px-3 py-2 text-center text-xs font-bold text-ink/70">On Safari, tap Share, then Add to Home Screen.</p>}
        {fallbackMessage && <p role="status" className="mt-3 rounded-xl bg-coral/15 px-3 py-2 text-center text-xs font-bold text-coral">{fallbackMessage}</p>}
      </div>
    </div>
  )
}
