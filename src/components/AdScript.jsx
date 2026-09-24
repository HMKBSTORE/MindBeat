import { useEffect, useRef } from 'react'

export default function AdScript({ src, width, height, label = 'Advertisement', className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    host.replaceChildren()
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.adsterra = 'mindbeat-banner'
    script.referrerPolicy = 'no-referrer-when-downgrade'
    host.appendChild(script)

    return () => {
      script.remove()
      host.replaceChildren()
    }
  }, [src])

  return (
    <div
      ref={hostRef}
      className={className}
      style={{ width: width ? `${width}px` : undefined, minHeight: height ? `${height}px` : undefined }}
      role="complementary"
      aria-label={label}
    />
  )
}

export function GlobalAdScript({ src }) {
  useEffect(() => {
    if (document.querySelector(`script[data-adsterra-global="${src}"]`)) return undefined

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.adsterraGlobal = src
    script.referrerPolicy = 'no-referrer-when-downgrade'
    document.body.appendChild(script)

    return undefined
  }, [src])

  return null
}