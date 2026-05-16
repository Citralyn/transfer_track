import { Link } from 'react-router-dom'
import type { MatchResult, Professor } from '../types'
import { Badge } from './Badge'

type ProfessorCardProps = {
  result: MatchResult<Professor>
}

export function ProfessorCard({ result }: ProfessorCardProps) {
  const { item, reasons, score } = result
  return (
    <article className="rounded-3xl border border-pink-100 bg-white p-6 shadow-[0_20px_40px_rgba(249,207,232,0.25)] transition hover:shadow-[0_24px_50px_rgba(249,207,232,0.35)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-orange-600">{item.department}</p>
          <h3 className="mt-2 text-xl font-semibold text-slate-900">{item.name}</h3>
          <p className="mt-1 text-sm text-slate-500">{item.title} • {item.university}</p>
        </div>
        <Badge label={`${score} pts`} variant="strong" />
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.researchAreas.map((area) => (
          <Badge key={area} label={area} />
        ))}
      </div>
      <div className="mt-5 space-y-2 text-sm text-slate-600">
        {reasons.slice(0, 3).map((reason) => (
          <p key={reason}>• {reason}</p>
        ))}
      </div>
      <Link
        to={`/professor/${item.id}`}
        className="mt-6 inline-flex items-center rounded-full bg-gradient-to-r from-orange-400 to-pink-500 px-5 py-2 text-sm font-semibold text-white transition hover:opacity-95"
      >
        View Professor
      </Link>
    </article>
  )
}
