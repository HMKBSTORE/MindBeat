export function launchConfetti() {
  const colors = ['#6C3CE9', '#FFC93C', '#2DD4A7', '#FF6B5B']
  const layer = document.createElement('div')
  layer.className = 'confetti-layer'
  layer.setAttribute('aria-hidden', 'true')

  for (let i = 0; i < 56; i += 1) {
    const piece = document.createElement('i')
    piece.style.setProperty('--x', `${Math.random() * 100}%`)
    piece.style.setProperty('--delay', `${Math.random() * 180}ms`)
    piece.style.setProperty('--duration', `${700 + Math.random() * 650}ms`)
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 180}px`)
    piece.style.backgroundColor = colors[i % colors.length]
    layer.appendChild(piece)
  }

  document.body.appendChild(layer)
  window.setTimeout(() => layer.remove(), 1600)
}
