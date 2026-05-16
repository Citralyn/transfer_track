import { Badge } from './Badge'
import type { Resource } from '../types'

type ResourceCardProps = {
  resource: Resource
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{resource.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{resource.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
      </div>
      <a
        href={resource.link}
        className="mt-5 inline-flex text-sm font-semibold text-sky-700 hover:text-sky-900 dark:text-sky-300"
      >
        View resource
      </a>
    </article>
  )
}
