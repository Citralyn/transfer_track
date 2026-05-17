import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="app-card rounded-lg px-6 py-12 text-center">
      <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-md gradient-soft text-accent-600">
        {icon}
      </div>
      <h3 className="font-serif text-2xl font-normal text-brand-900">{title}</h3>
      {description && (
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-brand-500">
          {description}
        </p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  )
}
