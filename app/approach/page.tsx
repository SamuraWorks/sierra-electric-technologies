import { ArrowRight, Recycle, Sprout, Sun, Zap } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/Button'
import { Reveal } from '@/components/Reveal'
import { energyPoints, images, mobilityPoints, processSteps, services } from '@/lib/site'

export const metadata = {
  title: 'Our Approach | Sierra Electric Technologies',
  description:
    'How SET works: electric mobility, clean energy, smart agriculture and climate innovation — from problem to prototype to deployment with young Sierra Leonean builders.',
}

const serviceIcons: Record<string, typeof Zap> = {
  'electric-mobility': Zap,
  'clean-energy': Sun,
  'smart-agriculture': Sprout,
  'climate-innovation': Recycle,
}

function ServiceCards() {
  return (
    <section className="section container" id="capabilities">
      <SectionHeading
        index="01"
        kicker="What SET does"
        title={
          <>
            Four capable paths to a <em>cleaner future.</em>
          </>
        }
        description="Our systems-thinking approach connects energy, mobility, agriculture, engineering and people — moving from problem to prototype to deployment."
      />
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
    </section>
  )
}

function SectorGrid() {
  return (
    <>
      <section className="section section-alt" id="mobility">
        <div className="container">
          <div className="sector-grid">
            <Reveal>
              <div className="sector-story">
                <p className="section-head__meta">
                  <span className="cell-idx">02</span>
                  <span className="kicker">Electric mobility</span>
                </p>
                <h2>
                  Mobility that respects <em>Sierra Leonean roads.</em>
                </h2>
                <p>
                  From the first 100% electric shuttle to wheelchair-accessible Keke conversions,
                  SET designs transport around local terrain, charging reality and serviceability.
                </p>
                <div className="sector-points">
                  {mobilityPoints.map((point) => (
                    <div className="sector-point" key={point.title}>
                      <Zap size={15} aria-hidden="true" />
                      <div>
                        <h3>{point.title}</h3>
                        <p>{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <figure className="sector-visual">
                <img src={images.shuttle} alt="SET electric shuttle minibus" loading="lazy" />
                <figcaption className="sector-visual__caption">
                  SET / EV-01 · Local build
                  <small>Shuttle · Keke · Mini Bus · SEFT-V</small>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>

      <section className="section" id="energy">
        <div className="container">
          <div className="sector-grid sector-grid--reverse">
            <Reveal>
              <div className="sector-story">
                <p className="section-head__meta">
                  <span className="cell-idx">03</span>
                  <span className="kicker">Clean energy</span>
                </p>
                <h2>
                  Energy access from <em>sunlight to socket.</em>
                </h2>
                <p>
                  SET works across solar generation, storage, lighting and charging — including a
                  circular model that recovers and repurposes usable battery cells.
                </p>
                <div className="sector-points">
                  {energyPoints.map((point) => (
                    <div className="sector-point" key={point.title}>
                      <Sun size={15} aria-hidden="true" />
                      <div>
                        <h3>{point.title}</h3>
                        <p>{point.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
            <Reveal delay={100}>
              <figure className="sector-visual">
                <img src={images.panel} alt="SET solar panel work" loading="lazy" />
                <figcaption className="sector-visual__caption">
                  Circular energy
                  <small>Backpacks · Device-to-Lamp · Smart Farm</small>
                </figcaption>
              </figure>
            </Reveal>
          </div>
        </div>
      </section>
    </>
  )
}

function Process() {
  return (
    <section className="section section-alt" id="process">
      <div className="container">
        <SectionHeading
          index="04"
          kicker="How we work"
          title={
            <>
              From problem to <em>proof.</em>
            </>
          }
          description="SET moves deliberately through six stages, anchoring every project in local realities and validating honestly before wider deployment."
        />
        <div className="process-grid">
          {processSteps.map((step, i) => (
            <Reveal key={step.step} delay={i * 60} className="grid-reveal">
              <div className="process-step">
                <span className="process-step__num">STEP {step.step}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
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
        <span className="eyebrow-dot" aria-hidden="true" /> Start a conversation
      </span>
      <h2>
        Build the next <em>practical solution.</em>
      </h2>
      <p>
        Contact SET for a verified capability brief, project references and partnership options.
      </p>
      <Button href="/contact" arrow>
        Talk to SET
      </Button>
    </section>
  )
}

export default function ApproachPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="detail-hero container">
          <p className="detail-category">How SET works</p>
          <h1>
            Local problems, <em>local engineering.</em>
          </h1>
          <p className="detail-summary">
            Electric mobility, clean energy, smart agriculture and climate innovation — each
            offering moves from listening and research to engineering, prototype, testing and
            deployment with young Sierra Leonean builders.
          </p>
        </section>
        <ServiceCards />
        <SectorGrid />
        <Process />
        <Cta />
      </main>
      <Footer />
    </>
  )
}