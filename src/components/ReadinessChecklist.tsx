type ReadinessChecklistProps = {
  steps: string[]
}

export function ReadinessChecklist({ steps }: ReadinessChecklistProps) {
  return (
    <div className="rounded-3xl border border-orange-100 bg-orange-50 p-6 shadow-[0_20px_40px_rgba(249,207,232,0.25)]">
      <h3 className="text-xl font-semibold text-slate-900">Career readiness checklist</h3>
      <ul className="mt-4 space-y-3 text-sm text-slate-700">
        {steps.map((step) => (
          <li key={step} className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[0.65rem] font-bold text-white">✓</span>
            <span>{step}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
