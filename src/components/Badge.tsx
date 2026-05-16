type BadgeProps = {
  label: string
  variant?: 'soft' | 'strong'
}

export function Badge({ label, variant = 'soft' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.15em] ${
        variant === 'strong'
          ? 'bg-slate-900 text-white'
          : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200'
      }`}
    >
      {label}
    </span>
  )
}
