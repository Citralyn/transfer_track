import { Link } from 'react-router-dom'
import type { MatchResult, Professor } from '../types'
import { Badge } from './Badge'

type ProfessorCardProps = {
  result: MatchResult<Professor>
}

export function ProfessorCard({ result }: ProfessorCardProps) {
  const { item, reasons, score } = result
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition hover:shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-sky-700">{item.department}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900 dark:text-white">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{item.title} • {item.university}</p>
        </div>
        <Badge label={`${score} pts`} variant="strong" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.researchAreas.map((area) => (
          <Badge key={area} label={area} />
        ))}
      </div>
      <div className="mt-5 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {reasons.slice(0, 3).map((reason) => (
          <p key={reason}>• {reason}</p>
        ))}
      </div>
      <Link
        to={`/professor/${item.id}`}
        className="mt-6 inline-flex items-center rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
      >
        View Professor
      </Link>
    </article>
  )
}
