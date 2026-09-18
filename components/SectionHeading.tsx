import { Reveal } from './Reveal'

type SectionHeadingProps = {
  kicker: string
  title: React.ReactNode
  description?: string
  children?: React.ReactNode
  align?: 'left' | 'center'
}

export function SectionHeading({ kicker, title, description, children, align = 'left' }: SectionHeadingProps) {
  return (
    <Reveal>
      <div className={`section-head section-head-${align}`}>
        <div className="section-head__main">
          {kicker && (
            <p className="section-head__meta">
              <span className="kicker">{kicker}</span>
            </p>
          )}
          <h2>{title}</h2>
          {description && <p className="section-head__desc">{description}</p>}
        </div>
        {children && <div className="section-head__action">{children}</div>}
      </div>
    </Reveal>
  )
}