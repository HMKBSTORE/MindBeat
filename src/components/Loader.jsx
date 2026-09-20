export default function Loader({ label = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[18rem] py-20 gap-3 text-ink/50">
      <div className="loader-fox" aria-hidden="true">🦊</div>
      <p className="font-medium text-sm">{label}</p>
    </div>
  )
}
