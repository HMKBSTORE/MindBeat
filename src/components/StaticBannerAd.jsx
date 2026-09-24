import AdScript from './AdScript'

const AD_SCRIPTS = {
  cec18556d49d26ed90145b3d0897b9b7: 'https://www.highrevenueformat.com/cec18556d49d26ed90145b3d0897b9b7/invoke.js',
  c0f1d8d38891544f85367a7b10460988: 'https://www.highrevenueformat.com/c0f1d8d38891544f85367a7b10460988/invoke.js',
  e6a90c81da6ce7259296f90e8cd187e8: 'https://pl31429569.profitableratecpmnetwork.com/e6a90c81da6ce7259296f90e8cd187e8/invoke.js',
}

export default function StaticBannerAd({ adKey, width, height, label = 'Advertisement', className = '' }) {
  const src = AD_SCRIPTS[adKey]
  if (!src) return null

  return (
    <div className="ad-frame flex max-w-full justify-center overflow-hidden">
      <AdScript src={src} width={width} height={height} label={label} className={className} />
    </div>
  )
}
