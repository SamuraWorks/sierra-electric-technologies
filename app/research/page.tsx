import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Reveal } from '@/components/Reveal'
import {
  featuredProject,
  programmes,
  projectHref,
  projects,
  rdDomains,
  skillsChips,
} from '@/lib/site'

export const metadata = {
  title: 'Research | Sierra Electric Technologies',
  description:
    'SET research and development across EV systems, batteries, solar, agriculture technology, sensors, IoT and AI — with projects, builds, programmes and a transparent portfolio.',
}

function Featured() {
  return (
    <section className="section container" id="featured-case">
      <SectionHeading
        index="01"
        kicker="Flagship build"
        title={
          <>
            Sierra Leone&apos;s first 100% <em>electric shuttle.</em>
          </>
        }
        description="Designed and built locally, with a wheelchair ramp, accessibility and 75% locally sourced materials at its core."
      />
      <Reveal>
        <article className="featured">
          <div className="browser-bar" aria-hidden="true">
            <i />
            <i />
            <i />
            <p>
              SET / EV-01 <span className="browser-code">· electric-mobility</span>
            </p>
          </div>
          <div className="featured-inner">
            <div className="featured-copy">
              <Badge tone="accent">{featuredProject.status}</Badge>
              <h3>{featuredProject.title}</h3>
              <p>{featuredProject.caseStudy}</p>
              <div className="featured-meta">
                {featuredProject.meta.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
              <Button href={featuredProject.href} arrow>
                Read the case study
              </Button>
            </div>
            <div className="featured-visual">
              <img src={featuredProject.image} alt={featuredProject.imageAlt} loading="lazy" />
            </div>
          </div>
        </article>
      </Reveal>
    </section>
  )
}

function Portfolio() {
  return (
    <section className="section section-alt" id="portfolio">
      <div className="container">
        <SectionHeading
          index="02"
          kicker="The full portfolio"
          title={
            <>
              Built, piloted and <em>in development.</em>
            </>
          }
          description="Every record below is presented honestly: builds, pilots, concepts and future directions are labelled so partners know exactly what exists today."
        />
        <div className="project-grid">
          {projects.map((project, i) => (
            <Reveal key={project.title} delay={(i % 3) * 70} className="grid-reveal">
              <article className="project-card">
                {project.image ? (
                  <div className="project-card__media">
                    <img src={project.image} alt={project.imageAlt} loading="lazy" />
                    <Badge>{project.tag}</Badge>
                  </div>
                ) : (
                  <div className="project-card__media">
                    <div className="figure-pending">
                      <span>Figure to be supplied</span>
                    </div>
                    <Badge>{project.tag}</Badge>
                  </div>
                )}
                <div className="project-card__body">
                  <span className="kicker">{project.tag}</span>
                  <h3>{project.title}</h3>
                  <p>{project.description}</p>
                  <a className="project-card__link" href={projectHref(project.title)}>
                    Project file <ArrowRight size={14} aria-hidden="true" />
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function RD() {
  return (
    <section className="section" id="innovation">
      <div className="container">
        <SectionHeading
          index="03"
          kicker="Research, development & skills"
          title={
            <>
              Engineering the <em>whole system.</em>
            </>
          }
          description="From vehicle systems to embedded sensing — SET works across the full stack of a climate-technology company."
        />
        <div className="tech-grid">
          <Reveal className="grid-reveal">
            <article className="tech-card">
              <span className="tech-card__tag">
                <span className="eyebrow-dot" aria-hidden="true" /> Research & development
              </span>
              <h3>Building the technology</h3>
              <p>
                SET works across the full stack of a climate-technology company — from vehicle
                systems to embedded sensing.
              </p>
              <div className="chipset">
                {rdDomains.map((domain) => (
                  <span key={domain}>{domain}</span>
                ))}
              </div>
            </article>
          </Reveal>
          <Reveal delay={80} className="grid-reveal">
            <article className="tech-card">
              <span className="tech-card__tag">
                <span className="eyebrow-dot" aria-hidden="true" /> Skills and programmes
              </span>
              <h3>Building the people who build</h3>
              <p>
                GreenShift develops youth climate innovation. FORGE creates practical pathways for
                women into welding, fabrication, EV wiring and green employment.
              </p>
              <div className="chipset">
                {skillsChips.map((skill) => (
                  <span key={skill}>{skill}</span>
                ))}
              </div>
            </article>
          </Reveal>
        </div>

        <div className="programme-grid" id="programmes">
          {programmes.map((programme, i) => (
            <Reveal key={programme.title} delay={i * 80} className="grid-reveal">
              <a
                className={`programme-card programme-card--${programme.accent ?? 'leaf'}`}
                href={programme.href}
              >
                <span className="programme-number">{programme.number}</span>
                <span className="p-badge">{programme.status}</span>
                <h3>{programme.title}</h3>
                <p>{programme.description}</p>
                <span className="p-link">
                  Programme information <ArrowRight size={14} aria-hidden="true" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="detail-cta">
      <span className="kicker">
        <span className="eyebrow-dot" aria-hidden="true" /> Partner with SET
      </span>
      <h2>
        Let&apos;s build the <em>next one together.</em>
      </h2>
      <p>
        Discuss a build, fund a prototype, pilot a programme or commission SET engineering for your
        organisation.
      </p>
      <Button href="/contact" arrow>
        Start a conversation
      </Button>
    </section>
  )
}

export default function ResearchPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="detail-hero container">
          <p className="detail-category">Research, builds and programmes</p>
          <h1>
            Real builds, honest <em>labels.</em>
          </h1>
          <p className="detail-summary">
            From Sierra Leone&apos;s first 100% electric vehicle to circular energy concepts, this is
            the SET engineering record — clearly marked as built, piloted, in development or pending
            confirmation.
          </p>
        </section>
        <Featured />
        <Portfolio />
        <RD />
        <Cta />
      </main>
      <Footer />
    </>
  )
}