import { ArrowRight } from 'lucide-react'
import type { CSSProperties } from 'react'

type ButtonProps = {
  href?: string
  variant?: 'primary' | 'ghost' | 'text'
  size?: 'base' | 'sm'
  children: React.ReactNode
  arrow?: boolean
  className?: string
  style?: CSSProperties
}

export function Button({
  href = '#',
  variant = 'primary',
  size = 'base',
  children,
  arrow = false,
  className = '',
  style,
}: ButtonProps) {
  return (
    <a className={`btn btn-${variant} btn-${size} ${className}`.trim()} href={href} style={style}>
      <span>{children}</span>
      {arrow && <ArrowRight size={15} aria-hidden="true" />}
    </a>
  )
}