'use client'

import { useState } from 'react'
import {
  ArrowRight,
  BatteryCharging,
  Check,
  ChevronDown,
  Globe2,
  Leaf,
  Menu,
  MoveUpRight,
  PlugZap,
  Sprout,
  Users,
  X,
  Zap,
} from 'lucide-react'

const navItems = [
  { label: 'About', href: '#about' },
  { label: 'What We Do', href: '#work' },
  { label: 'Projects', href: '#projects' },
  { label: 'Programmes', href: '#programmes' },
  { label: 'Impact', href: '#impact' },
  { label: 'News', href: '#news' },
]

const capabilities = [
  { icon: PlugZap, title: 'Electric mobility', text: 'Adapting vehicles, battery systems and charging infrastructure for local realities.' },
  { icon: Leaf, title: 'Clean energy', text: 'Building practical renewable energy and storage solutions for resilient communities.' },
  { icon: Sprout, title: 'Smart agriculture', text: 'Connecting farms with solar power, monitoring and better water management.' },
]

const projects = [
  { tag: 'Built in Sierra Leone', title: 'Electric Shuttle', text: 'The country\'s first 100% electric shuttle minibus, designed with a wheelchair ramp and 75% locally sourced materials.', className: 'project-shuttle' },
  { tag: 'In development', title: 'Electric Keke Conversion', text: 'Retrofitting familiar transport platforms to reduce fuel dependency, operating costs and urban pollution.', className: 'project-keke' },
  { tag: 'Demonstration site', title: 'GreenShift Systems', text: 'An integrated blueprint connecting solar energy, EV mobility and climate-smart agriculture.', className: 'project-farm' },
]

function Mark({ light = false }: { light?: boolean }) {
  return <div className={`brand-mark ${light ? 'brand-mark-light' : ''}`} aria-hidden="true"><span /><span /><span /><span /></div>
}

function Button({ children, variant = 'primary', href = '#' }: { children: React.ReactNode; variant?: 'primary' | 'outline'; href?: string }) {
  return <a className={`pill-button ${variant}`} href={href}>{children}<ArrowRight size={16} strokeWidth={2.2} /></a>
}

export default function Page() {
  const [menuOpen, setMenuOpen] = useState(false)
  return (
    <main>
      <header className="site-header">
        <a className="brand" href="#top" aria-label="Sierra Electric Technologies home"><Mark /><span>SIERRA ELECTRIC<br /><b>TECHNOLOGIES</b></span></a>
        <nav id="mobile-navigation" className={`desktop-nav ${menuOpen ? 'is-open' : ''}`} aria-label="Main navigation">
          {navItems.map((item) => <a key={item.href} href={item.href} onClick={() => setMenuOpen(false)}>{item.label}</a>)}
          <Button href="#contact">Partner with us</Button>
        </nav>
        <div className="header-actions"><button className="language" aria-label="Change language"><Globe2 size={18} /> EN</button><button className="menu-button" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="mobile-navigation" aria-label={menuOpen ? 'Close menu' : 'Open menu'}>{menuOpen ? <X /> : <Menu />}</button></div>
      </header>

      <section className="hero section-pad" id="top">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-dot" /> Sierra Leonean climate technology</span>
          <h1>Engineering a <em>cleaner, smarter</em> future.</h1>
          <p className="hero-sub">We develop practical clean energy, electric mobility, climate and engineering solutions designed for Sierra Leone and Africa.</p>
          <div className="hero-actions"><Button href="#projects">Explore our work</Button><Button variant="outline" href="#about"><Users size={17} /> About SET</Button></div>
          <a className="text-link" href="#contact">Let&apos;s build what comes next <MoveUpRight size={15} /></a>
        </div>
        <div className="hero-visual" aria-label="Illustration of SET electric shuttle">
          <div className="visual-label label-top">SET / EV-01 <span>prototype</span></div>
          <div className="sun-disc" />
          <div className="hero-lines" />
          <div className="shuttle-art"><div className="shuttle-window"><span /><span /><span /></div><div className="shuttle-body"><i /><i /><i /><i /></div><div className="wheel wheel-a" /><div className="wheel wheel-b" /></div>
          <div className="visual-label label-bottom"><span className="green-line" /> Built here. Engineered for here.</div>
        </div>
      </section>

      <section className="capabilities section-pad" id="work"><div className="section-intro"><span className="kicker">What we build</span><h2>Technology made for<br /><em>real-world impact.</em></h2><p>We move ideas from problem to prototype to practical deployment — with local engineering at every step.</p></div><div className="capability-grid">{capabilities.map(({ icon: Icon, title, text }) => <article className="capability-card" key={title}><div className="icon-chip"><Icon size={21} /></div><h3>{title}</h3><p>{text}</p><a href="#projects" className="card-link">Learn more <ArrowRight size={15} /></a></article>)}</div></section>

      <section className="dark-section section-pad" id="about"><div className="dark-grid"><div><span className="kicker light-kicker">Our difference</span><h2>We don&apos;t just talk about the future.<br /><em>We try to build it.</em></h2></div><div><p className="dark-lead">Sierra Leone does not have to wait for the world to solve its problems. SET SL connects energy, mobility and agriculture into systems that can scale across West Africa.</p><ul className="check-list"><li><Check size={16} /> 75% locally sourced shuttle build</li><li><Check size={16} /> Recognised by the 2024 National Innovation Challenge</li><li><Check size={16} /> MOCTI 2025 Young Innovator of the Year</li></ul><Button href="#contact">Partner with SET</Button></div></div></section>

      <section className="feature-strip section-pad"><span>Problem</span><i /><span>Research</span><i /><span>Prototype</span><i /><span>Testing</span><i /><span>Deployment</span><i /><span>Impact</span></section>

      <section className="projects-section section-pad" id="projects"><div className="section-heading-row"><div><span className="kicker">Selected work</span><h2>Proof in progress.</h2></div><a className="text-link" href="#contact">View all projects <ArrowRight size={15} /></a></div><div className="project-browser"><div className="browser-bar"><span /><span /><span /><p>set.sl / projects / electric-shuttle</p><span className="browser-code">01 — 03</span></div><div className="project-feature"><div className="project-feature-copy"><span className="status-pill"><span /> Built in Sierra Leone</span><h3>Electric<br /><em>Shuttle</em></h3><p>A locally built 10-seat electric shuttle with accessibility considerations, including a wheelchair ramp.</p><div className="project-meta"><span>Electric mobility</span><span>Freetown, Sierra Leone</span></div><a href="#contact" className="card-link">Explore the case study <ArrowRight size={15} /></a></div><div className="project-visual"><div className="mountain mountain-one" /><div className="mountain mountain-two" /><div className="road" /><div className="feature-shuttle"><div className="feature-windows" /><div className="feature-base" /><div className="feature-wheel one" /><div className="feature-wheel two" /></div><span className="coordinate">8°29&apos;N<br />13°14&apos;W</span></div></div></div><div className="project-cards">{projects.slice(1).map((project) => <article className="project-card" key={project.title}><div className={`project-thumb ${project.className}`}><span className="status-pill">{project.tag}</span><div className="thumb-shape" /></div><div className="project-card-copy"><span className="kicker">{project.title}</span><p>{project.text}</p><a className="card-link" href="#contact">View project <ArrowRight size={15} /></a></div></article>)}</div></section>

      <section className="programmes section-pad" id="programmes"><div className="programme-copy"><span className="kicker">People power technology</span><h2>Building the skills<br />behind a <em>greener future.</em></h2><p>From GreenShift climate innovation to FORGE&apos;s hands-on technical training for women, we create pathways into emerging green industries.</p><Button href="#contact">Explore our programmes</Button></div><div className="programme-stack"><div className="programme-card forge"><span className="programme-number">02</span><span className="status-pill">Applications closed</span><h3>FORGE</h3><p>Fabrication, Operations and Roads to Green Employment.</p><span className="programme-arrow"><ArrowRight /></span></div><div className="programme-card greenshift"><span className="programme-number">01</span><span className="status-pill">Climate innovation</span><h3>GreenShift</h3><p>Supporting young people to build solutions for a changing climate.</p><span className="programme-arrow"><ArrowRight /></span></div></div></section>

      <section className="impact-section section-pad" id="impact"><div className="section-intro"><span className="kicker">Impact, honestly measured</span><h2>Proof, not<br /><em>promises.</em></h2><p>We share what has been built, what is being tested and what comes next — clearly labelled so partners can see the evidence behind the ambition.</p></div><div className="stats-grid"><div><b>01</b><span>100% electric shuttle minibus built in Sierra Leone</span></div><div><b>75%</b><span>locally sourced materials in the shuttle build</span></div><div><b>2024</b><span>National Innovation Challenge winner</span></div><div><b>2025</b><span>MOCTI Young Innovator of the Year recognition</span></div></div></section>

      <section className="contact-section section-pad" id="contact"><div><span className="kicker light-kicker">Start a conversation</span><h2>Let&apos;s build what<br /><em>comes next.</em></h2></div><div><p>Whether you are building a partnership, funding a pilot or looking for your place in Africa&apos;s green future, we want to hear from you.</p><a className="contact-email" href="mailto:hello@set.sl">hello@set.sl <MoveUpRight size={18} /></a></div></section>

      <footer className="site-footer"><div className="footer-main"><a className="brand brand-footer" href="#top"><Mark light /><span>SIERRA ELECTRIC<br /><b>TECHNOLOGIES</b></span></a><p>A Sierra Leonean technology and engineering company building practical solutions for a cleaner, smarter future.</p><div className="socials"><a href="#contact" aria-label="LinkedIn">in</a><a href="#contact" aria-label="Instagram">ig</a><a href="#contact" aria-label="X">x</a></div></div><div className="footer-links"><div><span>Explore</span><a href="#about">About SET</a><a href="#work">What we do</a><a href="#projects">Projects</a><a href="#impact">Impact</a></div><div><span>Connect</span><a href="#programmes">Programmes</a><a href="#contact">Partner with us</a><a href="#contact">Careers</a><a href="mailto:hello@set.sl">Contact</a></div></div><div className="footer-bottom"><span>© 2026 Sierra Electric Technologies</span><span>Freetown, Sierra Leone <span className="footer-dot" /> Built for Africa</span></div></footer>
    </main>
  )
}
