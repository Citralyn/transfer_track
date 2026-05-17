import type { ReactNode } from 'react'

export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <div className="mb-4 flex items-center gap-4">
            <span className="h-px w-10 bg-brand-200" />
            <p className="section-label">
              {eyebrow}
            </p>
          </div>
        )}
        <h1 className="font-serif text-4xl font-normal leading-tight text-brand-900 md:text-5xl">
          {title}
        </h1>
        {description && (
          <p className="mt-3 text-base leading-7 text-brand-500 md:text-lg">
            {description}
          </p>
        )}
      </div>
      {action}
    </div>
  )
}
