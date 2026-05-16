type ReadinessChecklistProps = {
  steps: string[]
}

export function ReadinessChecklist({ steps }: ReadinessChecklistProps) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm dark:border-slate-700 dark:bg-slate-950">
      <h3 className="text-xl font-semibold text-slate-900 dark:text-white">Career readiness checklist</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-700 dark:text-slate-300">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-sky-900 text-[0.65rem] font-bold text-white">✓</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
