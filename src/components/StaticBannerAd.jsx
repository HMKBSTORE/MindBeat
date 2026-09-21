export default function StaticBannerAd({ adKey, width, height, label = 'Advertisement', className = '' }) {
  return (
    <div className={`ad-frame flex justify-center overflow-hidden ${className}`}>
      <iframe
        title={label}
        src={`https://highrevenueformat.com/${adKey}`}
        width={width}
        height={height}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        data-ad-key={adKey}
        style={{ border: 0, display: 'block', maxWidth: '100%' }}
      />
    </div>
  )
}
