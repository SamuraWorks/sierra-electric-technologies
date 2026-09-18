'use client'

import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { usePathname } from 'next/navigation'
import { nav } from '@/lib/site'
import { Logo } from './Logo'

export function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.documentElement.style.overflow = menuOpen ? 'hidden' : ''
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [menuOpen])

  const close = () => setMenuOpen(false)
  const isActive = (href: string) => pathname === href

  return (
    <header className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <Logo />
      <nav className="nav-links" aria-label="Main navigation">
        {nav.map((item) => (
          <a
            key={item.id}
            href={item.href}
            className={`nav-link ${isActive(item.href) ? 'is-active' : ''}`}
          >
            {item.label}
          </a>
        ))}
      </nav>
      <div className="nav-actions">
        <a href="/contact" className="btn btn-primary btn-sm">
          <span>Partner with us</span>
        </a>
        <button
          className="menu-toggle"
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <div className={`mobile-menu ${menuOpen ? 'is-open' : ''}`} aria-hidden={!menuOpen}>
        <nav className="mobile-menu__links" aria-label="Mobile navigation">
          {nav.map((item, i) => (
            <a key={item.id} href={item.href} onClick={close}>
              <span className="mobile-menu__idx">0{i + 1}</span>
              {item.label}
            </a>
          ))}
        </nav>
        <a href="/contact" className="btn btn-primary" onClick={close}>
          <span>Partner with us</span>
        </a>
        <p className="mobile-menu__contact">Freetown, Sierra Leone · @sierraelectricsl</p>
      </div>
    </header>
  )
}