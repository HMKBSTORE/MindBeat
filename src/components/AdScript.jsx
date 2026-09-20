import { useEffect, useRef } from 'react'

export default function AdScript({ src, containerId, width, height, label = 'Advertisement', className = '' }) {
  const hostRef = useRef(null)

  useEffect(() => {
    const host = hostRef.current
    if (!host) return undefined

    host.replaceChildren()
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.adsterra = 'mindbeat'
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
      id={containerId}
      className={className}
      style={{ width: width ? `${width}px` : undefined, minHeight: height ? `${height}px` : undefined }}
      role="complementary"
      aria-label={label}
    />
  )
}

export function GlobalAdScript({ src }) {
  useEffect(() => {
    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.dataset.adsterra = 'mindbeat-global'
    script.referrerPolicy = 'no-referrer-when-downgrade'
    document.body.appendChild(script)

    return () => script.remove()
  }, [src])

  return null
}
