import { Mail, MapPin, Phone } from 'lucide-react'
import { ADDRESS, EMAIL, FACEBOOK_URL, MAPS_URL, PHONE } from '@/lib/site'
import { Logo } from './Logo'

const exploreLinks = [
  { label: 'About', href: '/about' },
  { label: 'Our Approach', href: '/approach' },
  { label: 'The Team', href: '/team' },
  { label: 'Research', href: '/research' },
  { label: 'For Investors', href: '/investors' },
  { label: 'Contact', href: '/contact' },
]

const connectLinks = [
  { label: 'How we work', href: '/approach#process' },
  { label: 'Portfolio', href: '/research#portfolio' },
  { label: 'Programmes', href: '/research#programmes' },
  { label: 'Work with us', href: '/team#work' },
  { label: 'Institutional profile', href: '/about#directory' },
  { label: 'FAQ', href: '/contact#faq' },
]

export function Footer() {
  return (
    <footer className="footer" id="footer">
      <div className="footer__top">
        <div className="footer__identity">
          <Logo />
          <p>
            A Sierra Leonean technology and engineering company building practical solutions for a
            cleaner, smarter future.
          </p>
          <div className="footer__contact">
            <a className="contact-icon" href={`mailto:${EMAIL}`} aria-label="Contact SET by email" title="Contact SET by email">
              <Mail size={19} />
            </a>
            <a className="contact-icon" href={`tel:${PHONE}`} aria-label="Call SET" title="Call SET">
              <Phone size={19} />
            </a>
            <a
              className="contact-icon"
              href={MAPS_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Open SET location in Google Maps"
              title="Open location in Google Maps"
            >
              <MapPin size={19} />
            </a>
            <a
              className="contact-icon contact-facebook"
              href={FACEBOOK_URL}
              target="_blank"
              rel="noreferrer"
              aria-label="Visit Sierra Electric Technologies on Facebook"
              title="Visit SET on Facebook"
            >
              f
            </a>
          </div>
        </div>

        <nav className="footer__col" aria-label="Explore">
          <span className="footer__label">Explore</span>
          {exploreLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <nav className="footer__col" aria-label="Connect">
          <span className="footer__label">Connect</span>
          {connectLinks.map((link) => (
            <a key={link.label} href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
        <div className="footer__info">
          <span className="footer__label">Headquarters</span>
          <p>{ADDRESS}</p>
        </div>
      </div>
      <div className="footer__bottom">
        <span>© 2026 Sierra Electric Technologies SL</span>
        <span>
          Freetown, Sierra Leone <span className="footer-dot" aria-hidden="true" /> Built for Africa
        </span>
      </div>
    </footer>
  )
}