import Link from 'next/link'
import {
  ArrowLeft,
  ArrowRight,
  Bus,
  CheckCircle2,
  Info,
  Lightbulb,
  Recycle,
  Sprout,
  Sun,
  Zap,
} from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { services, projects, projectHref } from '@/lib/site'

type FocusItem = { icon: 'check' | 'info'; text: string }
type Connected = { title: string; icon: 'sprout' | 'recycle' | 'lightbulb' | 'bus' }
type Programme = {
  title: string
  category: string
  summary: string
  details: string[]
  focus?: FocusItem[]
  connected?: Connected[]
}

const programmes: Record<'forge' | 'greenshift', Programme> = {
  forge: {
    title: 'FORGE',
    category: 'Women · fabrication · green employment',
    summary:
      'Fabrication, Operations and Roads to Green Employment: a practical pathway for women into welding, fabrication, EV wiring and technical work.',
    details: [
      'Six-week women-focused technical training concept.',
      'Hands-on learning designed around tools, workshop confidence and employable skills.',
      'Programme dates, cohort size, partners and application process require confirmation.',
    ],
  },
  greenshift: {
    title: 'GreenShift',
    category: 'Youth · climate innovation · systems',
    summary:
      'A youth-led climate innovation platform connecting electric mobility, clean energy, agriculture and community solutions.',
    details: [
      "SET's youth climate innovation platform — electric mobility, clean energy, agriculture and community-based solutions brought together in one integrated programme.",
      'Gives young builders a pathway from local problem identification to prototype, enterprise and deployment, connecting prototypes with climate entrepreneurship and green employment.',
      'Youth climate innovators gather, learn and build community; skills developed during GreenShift continue through SET initiatives and projects.',
      'The Sierra Circular Energy Initiative creates roles for youth collectors and technicians, feeding the same circular design work GreenShift champions.',
      'The work is designed to grow through partnerships, training, local production and evidence from field pilots.',
      'Partners, delivered projects, dates, cohort scale and outcomes require confirmation as the verified brief is finalised.',
    ],
    focus: [
      { icon: 'check', text: 'Platform direction: youth climate innovation across mobility, clean energy, agriculture and community solutions.' },
      { icon: 'check', text: 'Pathway: local problem to prototype, enterprise and deployment, connecting climate entrepreneurship with green employment.' },
      { icon: 'check', text: 'Associated initiatives: Sierra Circular Energy Initiative, GreenShift Systems blueprint, SEFT-V farm vehicle, Electric Shuttle.' },
      { icon: 'info', text: 'Partners, delivered projects, dates, cohort scale, funding model and measured outcomes require confirmation.' },
    ],
    connected: [
      { title: 'GreenShift Systems', icon: 'sprout' },
      { title: 'Sierra Circular Energy Initiative', icon: 'recycle' },
      { title: 'Device-to-Lamp', icon: 'lightbulb' },
      { title: 'Electric Shuttle', icon: 'bus' },
    ],
  },
}

const focusIcons = { check: CheckCircle2, info: Info }
const connectedIcons = { sprout: Sprout, recycle: Recycle, lightbulb: Lightbulb, bus: Bus }

export function generateStaticParams() {
  return Object.keys(programmes).map((slug) => ({ slug }))
}

export default async function ProgrammePage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const programme = programmes[slug as keyof typeof programmes] ?? programmes.greenshift
  const isGreenShift = slug === 'greenshift'

  return (
    <>
      <Navbar />
      <main>
        <section className="detail-hero container">
          <Link className="btn btn-text" href="/research#programmes">
            <ArrowLeft size={15} aria-hidden="true" /> Back to programmes
          </Link>
          <p className="detail-category">{programme.category}</p>
          <h1>{programme.title}</h1>
          <p className="detail-summary">{programme.summary}</p>
        </section>

        <section className="section">
          <div className="container">
            <div className="detail-body">
              <div className="detail-intro">
                <p className="section-head__meta">
                  <span className="cell-idx">Programme</span>
                  <span className="kicker">Profile</span>
                </p>
                <h2>The programme profile.</h2>
              </div>
              <div className="detail-copy">
                {programme.details.map((detail) => (
                  <article key={detail}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <p>{detail}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {isGreenShift && (
          <section className="section section-alt">
            <div className="container">
              <div className="detail-body">
                <div className="detail-intro">
                  <p className="section-head__meta">
                    <span className="cell-idx">Focus</span>
                    <span className="kicker">Where GreenShift works</span>
                  </p>
                  <h2>
                    Four connected <em>domains.</em>
                  </h2>
                </div>
                <div className="tech-grid">
                  {services.map((service) => (
                    <Link
                      key={service.slug}
                      className="tech-card"
                      href={`/work/${service.slug}`}
                    >
                      <span className="tech-card__tag">
                        {service.slug === 'electric-mobility' && <Zap size={16} aria-hidden="true" />}
                        {service.slug === 'clean-energy' && <Sun size={16} aria-hidden="true" />}
                        {service.slug === 'smart-agriculture' && <Sprout size={16} aria-hidden="true" />}
                        {service.slug === 'climate-innovation' && <Recycle size={16} aria-hidden="true" />}
                        {service.title}
                      </span>
                      <h3>{service.number} · {service.title}</h3>
                      <p>{service.description}</p>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {isGreenShift && (
          <section className="section">
            <div className="container">
              <div className="detail-body">
                <div className="detail-intro">
                  <p className="section-head__meta">
                    <span className="cell-idx">Projects</span>
                    <span className="kicker">Built with GreenShift</span>
                  </p>
                  <h2>
                    Skills in the <em>field.</em>
                  </h2>
                </div>
                <div className="detail-copy">
                  <article>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <p className="lead">
                      GreenShift capabilities show up across SET&apos;s built work — from the shuttle
                      and farm vehicle to circular energy products.
                    </p>
                  </article>
                </div>
                <div className="tech-grid">
                  {programme.connected?.map((item) => {
                    const project = projects.find((p) => p.title === item.title)
                    const Icon = connectedIcons[item.icon]
                    return (
                      <Link key={item.title} className="tech-card" href={projectHref(item.title)}>
                        <span className="tech-card__tag">
                          <Icon size={16} aria-hidden="true" /> {project?.tag ?? 'Project'}
                        </span>
                        <h3>{item.title}</h3>
                        <p>{project?.description}</p>
                        <span className="tech-card__link">
                          View project <ArrowRight size={14} aria-hidden="true" />
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        {programme.focus && (
          <section className="section section-alt">
            <div className="container">
              <div className="detail-body">
                <div className="detail-intro">
                  <p className="section-head__meta">
                    <span className="cell-idx">Status</span>
                    <span className="kicker">Honest about what is confirmed</span>
                  </p>
                  <h2>
                    Confirmed &amp; <em>pending.</em>
                  </h2>
                </div>
                <div className="focus-box">
                  <span className="lead">What we can confirm</span>
                  {programme.focus?.map((item) => {
                    const Icon = focusIcons[item.icon]
                    return (
                      <div className="focus-item" key={item.text}>
                        <Icon size={16} aria-hidden="true" />
                        <span>{item.text}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </section>
        )}

        <section className="detail-cta">
          <span className="kicker">
            <span className="eyebrow-dot" aria-hidden="true" /> Partner with SET
          </span>
          <h2>
            Help build what <em>comes next.</em>
          </h2>
          <p>
            Contact the team for the verified programme brief, partnership options, participation
            details and current availability.
          </p>
          <Link className="btn btn-primary" href="/contact">
            <span>Discuss the programme</span>
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </section>
      </main>
      <Footer />
    </>
  )
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const programme = programmes[slug as keyof typeof programmes] ?? programmes.greenshift
  return { title: programme.title, description: programme.summary }
}