type BadgeProps = {
  children: React.ReactNode
  tone?: 'muted' | 'accent' | 'leaf'
}

export function Badge({ children, tone = 'muted' }: BadgeProps) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="badge-dot" aria-hidden="true" />
      {children}
    </span>
  )
}