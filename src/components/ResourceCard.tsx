import { Badge } from './Badge'
import type { Resource } from '../types'

type ResourceCardProps = {
  resource: Resource
}

export function ResourceCard({ resource }: ResourceCardProps) {
  return (
    <article className="rounded-3xl border border-pink-100 bg-white p-6 shadow-[0_20px_40px_rgba(249,207,232,0.25)]">
      <h3 className="text-lg font-semibold text-slate-900">{resource.title}</h3>
      <p className="mt-3 text-sm leading-6 text-slate-600">{resource.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {resource.tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
      </div>
      <a
        href={resource.link}
        className="mt-5 inline-flex text-sm font-semibold text-orange-600 hover:text-orange-800"
      >
        View resource
      </a>
    </article>
  )
}
