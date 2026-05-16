type BadgeProps = {
  label: string
  variant?: 'soft' | 'strong'
}

export function Badge({ label, variant = 'soft' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
        variant === 'strong'
          ? 'bg-orange-500 text-white'
          : 'bg-pink-50 text-pink-700'
      }`}
    >
      {label}
    </span>
  )
}
