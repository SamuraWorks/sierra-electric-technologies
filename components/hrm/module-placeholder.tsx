import { Construction } from 'lucide-react'

export function ModulePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <p className="mb-2 text-[10.5px] font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
        Sierra Electric Technologies — HR
      </p>
      <h1 className="font-display text-3xl font-semibold text-[var(--text)]">{title}</h1>

      <div className="mt-10 grid place-items-center rounded-[var(--r-md)] border border-dashed border-[var(--line-2)] bg-[var(--surface)] px-6 py-20 text-center">
        <div className="grid size-14 place-items-center rounded-full bg-[var(--surface-2)] text-[var(--accent)]">
          <Construction className="size-7" />
        </div>
        <p className="mt-5 max-w-md text-sm text-[var(--text-2)]">{description}</p>
        <p className="mt-2 max-w-md text-xs text-[var(--muted)]">
          This module is part of the core HR system build and will appear here once implemented.
        </p>
      </div>
    </div>
  )
}