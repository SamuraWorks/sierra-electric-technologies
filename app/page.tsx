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
  { label: 'People', href: '#people' },
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
  return <img className={`brand-logo ${light ? 'brand-logo-light' : ''}`} src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1776285047875-mvtv8fMkk7osjEWCypeWq12mH6xUoD.jpg" alt="Sierra Electric Technologies logo" />
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
        <div className="hero-visual hero-photo" aria-label="SET electric shuttle in the workshop">
          <img className="hero-photo-image" src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/10%20Passenger%20E%20car%20for%20Africell%20Made%20by%20Sierra%20Electric.jfif-ZaMipho7TuDliZqhJp2H8U3QOYEpNi.jpeg" alt="SET's 10-passenger electric vehicle in its workshop" />
          <div className="hero-photo-overlay" />
          <div className="visual-label label-top">SET / EV-01 <span>built in Sierra Leone</span></div>
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

      <section className="people-section section-pad" id="people"><div className="section-heading-row"><div><span className="kicker">The people behind the work</span><h2>Young people,<br /><em>serious builders.</em></h2></div><p className="people-intro">SET is a youth-led company. Our team brings curiosity, technical courage and a shared belief that Sierra Leone can build its own future.</p></div><div className="people-grid"><article className="person-card person-feature"><div className="person-photo founder-photo"><img src="https://scontent.flhr4-3.fna.fbcdn.net/v/t39.30808-6/482022846_647442234769530_4917467005392329821_n.jpg?stp=dst-jpg_tt6&cstp=mx1280x960&ctp=s960x960&_nc_cat=104&ccb=1-7&_nc_sid=cc71e4&_nc_ohc=huYxfg2MDQYQ7kNvwEIskfr&_nc_oc=AdpQkWvsLL4qPIF7jsnLK-9RUWJP5mxwqCb_f701UB8rYHgiBKJAfNwkNmc-6fmIurI&_nc_zt=23&_nc_ht=scontent.flhr4-3.fna&_nc_gid=CCKniunBUZVZg7zqAtFRbw&_nc_ss=79289&oh=00_AQILZGR9jG5l7MZSKM5wB13XZ28yo41nQmb8dJPwugHzjA&oe=6AA0759F" alt="Sierra Electric Technologies team and electric vehicle project" /></div><div className="person-copy"><span className="kicker">Leadership</span><h3>James Samba</h3><p>Founder &amp; CEO · 2025 MOCTI Young Innovator of the Year</p></div></article><article className="person-card"><div className="person-photo"><img src="https://scontent.flhr4-4.fna.fbcdn.net/v/t39.30808-6/773995618_1066284819551934_2910479569756396014_n.jpg?stp=c0.169.1024.1024a_dst-jpg_tt6&cstp=mx1024x1024&ctp=s160x160&_nc_cat=110&ccb=1-7&_nc_sid=8a6525&_nc_ohc=2uBUnBXKB9YQ7kNvwF-XQ1F&_nc_oc=AdqdQkWvsEybWBuKZ-1fKypbDbl3SF5PkuSPxWqVFtn8uM9ahFoOf3S5zCCHYAwK1U&_nc_zt=23&_nc_ht=scontent.flhr4-4.fna&_nc_gid=CCKniunBUZVZg7zqAtFRbw&_nc_ss=79289&oh=00_AQJkABjr5DovCYuCv5mjFqGw0UNI9Kre_ck4txMO6YiBMw&oe=6AA07DDB" alt="Young SET team member working on a technology project" /></div><div className="person-copy"><span className="kicker">Operations</span><h3>Co-founder &amp; Administration</h3><p>Building the systems, partnerships and coordination that help technical work move forward.</p></div></article><article className="person-card"><div className="person-photo"><img src="https://scontent.flhr4-3.fna.fbcdn.net/v/t39.30808-6/762737553_1056486233865126_6117072892511922994_n.jpg?stp=dst-jpg_tt6&cstp=mx1254x1254&ctp=s160x160&_nc_cat=101&ccb=1-7&_nc_sid=8a6525&_nc_ohc=FfxqgTgGuYYQ7kNvwEgcKZp&_nc_oc=AdoRHq3gyYYHddgKJPscYprT2ERqeRaJ4Hy2cbf2nSB_xKMMqGwC4W6toOR_enC1vqFs&_nc_zt=23&_nc_ht=scontent.flhr4-3.fna&_nc_gid=CCKniunBUZVZg7zqAtFRbw&_nc_ss=79289&oh=00_AQIIhvyGlujeuNCSomPp70oqPcgzIy3g5yYkGExjQxT45g&oe=6AA05BCF" alt="SET engineering work in progress" /></div><div className="person-copy"><span className="kicker">Engineering</span><h3>Chief Engineer &amp; team</h3><p>Designing, wiring, testing and improving the systems behind Sierra Leone&apos;s first electric vehicle.</p></div></article></div><div className="workspace-strip"><div><span className="kicker">Inside SET</span><h3>Our workspace is a lab, workshop and meeting place.</h3><p>Visitors, partners and young innovators are part of the build. See more of the work on our Facebook page.</p><a className="card-link" href="https://www.facebook.com/sierraelectricsl" target="_blank" rel="noreferrer">Visit SET on Facebook <MoveUpRight size={15} /></a></div><div className="workspace-images"><img src="https://scontent.flhr4-3.fna.fbcdn.net/v/t39.30808-6/754498220_1048345861345830_1792615650330090497_n.jpg?stp=dst-jpg_tt6&cstp=mx720x720&ctp=s160x160&_nc_cat=101&ccb=1-7&_nc_sid=8a6525&_nc_ohc=w3Bc5y2mF-wQ7kNvwH5EHp1&_nc_oc=Adpejw7SabgPldAQdu2D3wUOCLgQiDuCfScFrb1RikODXakfrwQWQN5auqxMsiq2v6U&_nc_zt=23&_nc_ht=scontent.flhr4-3.fna&_nc_gid=CCKniunBUZVZg7zqAtFRbw&_nc_ss=79289&oh=00_AQL0_dMEkQ-u0r8SPjGhhWlxF-EU1xpDbP-qu6-I6vzmRA&oe=6AA08000" alt="SET workspace and project documentation" /><img src="https://scontent.flhr4-3.fna.fbcdn.net/v/t39.30808-6/725578846_1019474357566314_2945348822613668832_n.jpg?stp=dst-jpg_tt6&cstp=mx1254x1254&ctp=s160x160&_nc_cat=109&ccb=1-7&_nc_sid=8a6525&_nc_ohc=GgM6m4ujLswQ7kNvwFeqpKZ&_nc_oc=AdqNjraHtB1rJnQk15-4HywkyoS2fzXOqcqkM62la4pGlx1Sg4aKlLDR-yIt6lKz9rM&_nc_zt=23&_nc_ht=scontent.flhr4-3.fna&_nc_gid=CCKniunBUZVZg7zqAtFRbw&_nc_ss=79289&oh=00_AQJb6bLL45u5kh9Bxxp_wrtv9u3rcRuhwYZnLiO0ju1m_A&oe=6AA073DE" alt="SET project visitors and collaborators" /><img src="https://scontent.flhr4-4.fna.fbcdn.net/v/t39.30808-6/715650221_1007013038812446_5368886696959879952_n.jpg?stp=c0.127.1170.1170a_dst-jpg_tt6&cstp=mx1170x1170&ctp=s160x160&_nc_cat=105&ccb=1-7&_nc_sid=8a6525&_nc_ohc=OW8XWiCHg4sQ7kNvwFvTQ9-&_nc_oc=AdrWL_zeQNh-OqZpwXNUTFjjX1-oy_ACobdH9mG5Q_USwdo58Z6oHr-EDK648_jX60Y&_nc_zt=23&_nc_ht=scontent.flhr4-4.fna&_nc_gid=CCKniunBUZVZg7zqAtFRbw&_nc_ss=79289&oh=00_AQL5YA5hUzR0Lwj2BhXE6r6mKlzqf6AYDNz4LKsy3qvoow&oe=6AA08C5F" alt="SET hands-on technology work" /></div></div></section>

      <section className="programmes section-pad" id="programmes"><div className="programme-copy"><span className="kicker">People power technology</span><h2>Building the skills<br />behind a <em>greener future.</em></h2><p>From GreenShift climate innovation to FORGE&apos;s hands-on technical training for women, we create pathways into emerging green industries.</p><Button href="#contact">Explore our programmes</Button></div><div className="programme-stack"><div className="programme-card forge"><span className="programme-number">02</span><span className="status-pill">Applications closed</span><h3>FORGE</h3><p>Fabrication, Operations and Roads to Green Employment.</p><span className="programme-arrow"><ArrowRight /></span></div><div className="programme-card greenshift"><span className="programme-number">01</span><span className="status-pill">Climate innovation</span><h3>GreenShift</h3><p>Supporting young people to build solutions for a changing climate.</p><span className="programme-arrow"><ArrowRight /></span></div></div></section>

      <section className="impact-section section-pad" id="impact"><div className="section-intro"><span className="kicker">Impact, honestly measured</span><h2>Proof, not<br /><em>promises.</em></h2><p>We share what has been built, what is being tested and what comes next — clearly labelled so partners can see the evidence behind the ambition.</p></div><div className="stats-grid"><div><b>01</b><span>100% electric shuttle minibus built in Sierra Leone</span></div><div><b>75%</b><span>locally sourced materials in the shuttle build</span></div><div><b>2024</b><span>National Innovation Challenge winner</span></div><div><b>2025</b><span>MOCTI Young Innovator of the Year recognition</span></div></div></section>

      <section className="contact-section section-pad" id="contact"><div><span className="kicker light-kicker">Start a conversation</span><h2>Let&apos;s build what<br /><em>comes next.</em></h2></div><div><p>Whether you are building a partnership, funding a pilot or looking for your place in Africa&apos;s green future, we want to hear from you.</p><a className="contact-email" href="mailto:sierraelectric.sl@gmail.com">sierraelectric.sl@gmail.com <MoveUpRight size={18} /></a><a className="contact-phone" href="tel:+23280247163">+232 80 247163</a><a className="contact-address" href="https://maps.google.com/?q=1+Sesay+Drive+off+Fadika+Drive+Imatt+Freetown+Sierra+Leone" target="_blank" rel="noreferrer">1 Sesay Drive, off Fadika Drive, Imatt, Freetown</a></div></section>

      <footer className="site-footer"><div className="footer-main"><a className="brand brand-footer" href="#top"><Mark light /><span>SIERRA ELECTRIC<br /><b>TECHNOLOGIES</b></span></a><p>A Sierra Leonean technology and engineering company building practical solutions for a cleaner, smarter future.</p><div className="socials"><a href="https://www.facebook.com/sierraelectricsl" target="_blank" rel="noreferrer" aria-label="Facebook">f</a><a href="#contact" aria-label="LinkedIn">in</a><a href="#contact" aria-label="Instagram">ig</a></div></div><div className="footer-links"><div><span>Explore</span><a href="#about">About SET</a><a href="#work">What we do</a><a href="#projects">Projects</a><a href="#impact">Impact</a></div><div><span>Connect</span><a href="#programmes">Programmes</a><a href="#contact">Partner with us</a><a href="#contact">Careers</a><a href="mailto:sierraelectric.sl@gmail.com">Contact</a></div></div><div className="footer-bottom"><span>© 2026 Sierra Electric Technologies</span><span>Freetown, Sierra Leone <span className="footer-dot" /> Built for Africa</span></div></footer>
    </main>
  )
}
