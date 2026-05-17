import { clsx } from 'clsx'

export function BrandLogo({
  compact = false,
  className,
}: {
  compact?: boolean
  className?: string
}) {
  if (compact) {
    return (
      <img
        src="/transfer-track-icon.png"
        alt="Transfer Track"
        className={clsx('object-contain', className)}
      />
    )
  }

  return (
    <img
      src="/transfer-track-logo.png"
      alt="Transfer Track"
      className={clsx('object-contain', className)}
    />
  )
}
