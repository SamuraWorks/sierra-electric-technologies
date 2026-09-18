import { ArrowRight, Recycle, Sprout, Sun, Zap } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Reveal } from '@/components/Reveal'
import { Counter } from '@/components/Counter'
import {
  featuredProject,
  images,
  impactStats,
  projectHref,
  projects,
  services,
} from '@/lib/site'

const serviceIcons: Record<string, typeof Zap> = {
  'electric-mobility': Zap,
  'clean-energy': Sun,
  'smart-agriculture': Sprout,
  'climate-innovation': Recycle,
}

const indexPages = [
  {
    title: 'About',
    blurb: 'Who we are, our story, key facts and a transparent institutional profile.',
    href: '/about',
  },
  {
    title: 'Our Approach',
    blurb: 'Electric mobility, clean energy, smart agriculture, climate innovation and how we work.',
    href: '/approach',
  },
  {
    title: 'The Team',
    blurb: 'The people behind the builds — and the pathways to join them.',
    href: '/team',
  },
  {
    title: 'Research',
    blurb: 'Builds, pilots and concept records, plus R&D and training programmes.',
    href: '/research',
  },
  {
    title: 'For Investors',
    blurb: 'Track record, growth directions, roadmap and partnership opportunities.',
    href: '/investors',
  },
  {
    title: 'Contact',
    blurb: 'Partnerships, support, research and a direct message to the team.',
    href: '/contact',
  },
]

function Hero() {
  return (
    <section className="hero container" id="top">
      <div className="hero-wash" aria-hidden="true" />
      <div className="hero-copy">
        <span className="eyebrow">
          <span className="eyebrow-dot" aria-hidden="true" /> Youth-led climate technology
        </span>
        <h1>
          Engineering a <em>cleaner, smarter</em> future.
        </h1>
        <p className="hero-sub">
          Sierra Electric Technologies builds practical clean-energy, electric-mobility,
          agricultural and climate solutions for Sierra Leone and Africa — moving from problem to
          prototype to deployment.
        </p>
        <div className="hero-actions">
          <Button href="/research" arrow>
            Explore our work
          </Button>
          <Button href="/about" variant="ghost">
            About SET
          </Button>
        </div>
        <a className="hero-staff" href="/auth/login">
          Staff login <ArrowRight size={11} aria-hidden="true" />
        </a>
        <div className="hero-facts">
          <div className="hero-fact">
            <b>100%</b>
            <span>First electric shuttle built in Sierra Leone</span>
          </div>
          <div className="hero-fact">
            <b>2024</b>
            <span>National Innovation Challenge winner</span>
          </div>
          <div className="hero-fact">
            <b>2025</b>
            <span>MOCTI Young Innovator of the Year</span>
          </div>
        </div>
      </div>

      <div className="hero-visual">
        <figure className="hero-photo">
          <img
            src={images.shuttleHero}
            alt="A SET electric shuttle built in Sierra Leone"
            width={640}
            height={460}
            fetchPriority="high"
          />
          <span className="hero-chip hero-chip--tl" aria-hidden="true">
            <span className="signal" />
            <span>
              SET / EV-01
              <br />
              Locally built
            </span>
          </span>
          <span className="hero-chip hero-chip--br" aria-hidden="true">
            <span>
              <b>75% locally sourced</b>
              materials · shuttle build
            </span>
          </span>
          <figcaption className="hero-caption">
            <span className="hero-caption__code">SET / EV-01</span>
            <p>First 100% electric vehicle built in Sierra Leone · built in Sierra Leone</p>
          </figcaption>
        </figure>
      </div>
    </section>
  )
}

function IndexPick() {
  return (
    <section className="section-tight container" id="sections">
      <Reveal>
        <p className="section-head__meta">
          <span className="kicker">Everything on the site</span>
        </p>
      </Reveal>
      <div className="index-grid">
        {indexPages.map((page, i) => (
          <Reveal key={page.title} delay={i * 60} className="grid-reveal">
            <a className="index-card" href={page.href}>
              <span className="index-card__top">
                <ArrowRight size={16} aria-hidden="true" />
              </span>
              <h3>{page.title}</h3>
              <p>{page.blurb}</p>
            </a>
          </Reveal>
        ))}
      </div>
    </section>
  )
}

function Services() {
  return (
    <section className="section section-alt" id="services">
      <div className="container">
        <SectionHeading
          kicker="What SET does"
          title={
            <>
              Technology made for <em>real-world impact.</em>
            </>
          }
          description="Our systems-thinking approach connects energy, mobility, agriculture, engineering and people — moving from problem to prototype to deployment."
        >
          <Button href="/approach" variant="ghost" size="sm" arrow>
            All capabilities & approach
          </Button>
        </SectionHeading>
        <div className="services-grid">
          {services.map((service, i) => {
            const Icon = serviceIcons[service.slug]
            return (
              <Reveal key={service.slug} delay={i * 70} className="grid-reveal">
                <article className="service-card">
                  <span className="service-card__num">{service.number}</span>
                  <div className="service-card__icon">
                    <Icon size={21} aria-hidden="true" />
                  </div>
                  <h3>{service.title}</h3>
                  <p>{service.description}</p>
                  <a className="service-card__link" href={`/work/${service.slug}`}>
                    Explore capability <ArrowRight size={14} aria-hidden="true" />
                  </a>
                </article>
              </Reveal>
            )
          })}
        </div>
      </div>
    </section>
  )
}

function Featured() {
  return (
    <section className="section" id="projects">
      <div className="container">
        <SectionHeading
          kicker="Flagship build"
          title={
            <>
              Sierra Leone&apos;s first 100% <em>electric shuttle.</em>
            </>
          }
        >
          <Button href="/research" variant="ghost" size="sm" arrow>
            Full portfolio
          </Button>
        </SectionHeading>

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

        <div className="project-grid">
          {projects.slice(1, 4).map((project, i) => (
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

function Impact() {
  return (
    <section className="section section-alt" id="impact">
      <div className="container">
        <SectionHeading
          kicker="Impact and recognition"
          title={
            <>
              Proof, not <em>promises.</em>
            </>
          }
          description="We distinguish verified achievements from pilots, concepts and future plans. Impact reporting will expand as SET confirms project data."
        />
        <div className="impact-grid">
          {impactStats.map((stat, i) => (
            <Reveal key={stat.label} delay={(i % 3) * 70} className="grid-reveal">
              <div className="stat-card">
                <b>{stat.value === '75%' ? <Counter to={75} suffix="%" /> : stat.value}</b>
                <span>{stat.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function HomeCta() {
  return (
    <section className="section container">
      <Reveal>
        <div className="home-cta">
          <span className="kicker">
            <span className="eyebrow-dot" aria-hidden="true" /> Build with SET
          </span>
          <h2>
            Build the next <em>practical solution.</em>
          </h2>
          <p>
            Partner, invest, support, join or research with Sierra Electric Technologies. The team
            will hear from you.
          </p>
          <div className="home-cta__actions">
            <Button href="/contact" arrow>
              Partner with us
            </Button>
            <Button href="/team" variant="ghost" arrow>
              Join the team
            </Button>
          </div>
        </div>
      </Reveal>
    </section>
  )
}

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <Hero />
        <IndexPick />
        <Services />
        <Featured />
        <Impact />
        <HomeCta />
      </main>
      <Footer />
    </>
  )
}