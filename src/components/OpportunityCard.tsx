import type { MatchResult, Opportunity } from '../types'
import { Badge } from './Badge'

type OpportunityCardProps = {
  result: MatchResult<Opportunity>
}

export function OpportunityCard({ result }: OpportunityCardProps) {
  const { item, reasons } = result
  return (
    <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{item.title}</h3>
        {item.beginnerFriendly && <Badge label="Beginner" />}
      </div>
      <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">{item.description}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {item.tags.map((tag) => (
          <Badge key={tag} label={tag} />
        ))}
      </div>
      <div className="mt-4 text-sm text-slate-600 dark:text-slate-300">
        {reasons.slice(0, 3).map((reason) => (
          <p key={reason}>• {reason}</p>
        ))}
      </div>
    </article>
  )
}
