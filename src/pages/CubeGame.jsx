import { Link } from 'react-router-dom'
import StaticBannerAd from '../components/StaticBannerAd'

export default function CubeGame() {
  return (
    <main className="fixed inset-0 z-50 bg-[#10131d]">
      <div className="absolute left-4 top-4 z-10">
        <Link
          to="/play"
          className="inline-flex items-center rounded-full bg-black/45 px-4 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-black/65"
        >
          Back to games
        </Link>
      </div>
      <iframe
        title="The Cube puzzle game"
        src="/games/the-cube/index.html"
        className="h-full w-full border-0"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-3 z-20 flex justify-center px-3">
        <StaticBannerAd
          adKey="cec18556d49d26ed90145b3d0897b9b7"
          width={320}
          height={50}
          label="Sponsored Cube game banner"
          className="pointer-events-auto rounded-lg bg-white/90 p-1 shadow-lg"
        />
      </div>
    </main>
  )
}