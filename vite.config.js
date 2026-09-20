import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// MindBeat — mobile-first quiz competition app
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'MindBeat',
        short_name: 'MindBeat',
        description: 'Quiz. Compete. Beat your friends.',
        id: '/',
        start_url: '/',
        theme_color: '#6C3CE9',
        background_color: '#FAF9FF',
        display: 'standalone',
        orientation: 'portrait',
        categories: ['education', 'games'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' }
        ]
      }
    })
  ]
})
