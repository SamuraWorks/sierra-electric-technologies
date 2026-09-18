import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/Button'
import { Reveal } from '@/components/Reveal'
import { Counter } from '@/components/Counter'
import { impactStats } from '@/lib/site'

export const metadata = {
  title: 'For Investors | Sierra Electric Technologies',
  description:
    'Investment and partnership in Sierra Leonean climate technology: SET’s track record, growth directions, roadmap and what partners should confirm.',
}

const roadmapDirections = [
  {
    title: 'Local expansion',
    description:
      'Extending mobility, energy and circular products across Freetown and Sierra Leone’s regions.',
  },
  {
    title: 'GreenShift pilots',
    description:
      'Field pilots of youth-led climate innovation in mobility, clean energy, agriculture and community solutions.',
  },
  {
    title: 'Manufacturing',
    description:
      'Scaling locally manufacturable designs — from the SEFT-V farm vehicle to shuttle and energy products.',
  },
  {
    title: 'Training & talent',
    description:
      'Growing skills-based programmes like FORGE and GreenShift that build a green-employed technical workforce.',
  },
  {
    title: 'Regional replication',
    description:
      'Exporting proven build-and-validate models to other African markets with similar realities.',
  },
  {
    title: 'New climate technologies',
    description:
      'Continued research across EV systems, batteries, solar, sensors, IoT, AI and embedded systems.',
  },
]

const partnershipTypes = [
  'Government',
  'Universities',
  'NGOs',
  'Development partners',
  'Funders',
  'Private sector',
  'Research collaborators',
]

function Opportunity() {
  return (
    <section className="section container" id="opportunity">
      <SectionHeading
        kicker="Why SET"
        title={
          <>
            A verified start, built for <em>scale.</em>
          </>
        }
        description="SET is an early-stage Sierra Leonean climate-technology company with a documented first — Sierra Leone’s first 100% electric vehicle — and a deliberate, evidence-first way of working."
      />
      <div className="about-grid">
        <div className="about-intro">
          <Reveal>
            <p className="section-head__meta">
              <span className="cell-idx" aria-hidden="true" />
              <span className="kicker">The opportunity</span>
            </p>
            <h2>
              Local innovation with <em>international relevance.</em>
            </h2>
            <p>
              SET turns everyday pressures — expensive fuel, unreliable electricity, difficult rural
              transport, growing e-waste — into practical products and pathways, built locally and
              designed for replication.
            </p>
          </Reveal>
        </div>
        <Reveal delay={80}>
          <div className="about-detail">
            <p>
              Incorporated in Freetown on <strong>29 July 2023</strong>, SET has already built
              Sierra Leone&apos;s first 100% electric vehicle with <strong>75%</strong> locally
              sourced materials, been named <strong>2024 National Innovation Challenge winner</strong>{' '}
              and received the <strong>2025 MOCTI Young Innovator of the Year</strong> recognition.
            </p>
            <p>
              The company moves deliberately from problem to research to prototype, testing,
              deployment and impact — measuring proof, not promises. That discipline makes capital
              and partnerships deployable against real, validated needs.
            </p>
            <div className="focus-box">
              <span className="lead">What partners should confirm</span>
              <p className="focus-note">
                Financial terms, current commercial products, funding model, valuation, milestones
                and impact data (CO₂, jobs, trainees, beneficiaries) are confirmed directly with
                SET.
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function TrackRecord() {
  return (
    <section className="section section-alt" id="impact">
      <div className="container">
        <SectionHeading
          kicker="Track record"
          title={
            <>
              Proof, not <em>promises.</em>
            </>
          }
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

function Roadmap() {
  return (
    <section className="section" id="roadmap">
      <div className="container">
        <SectionHeading
          kicker="Future roadmap"
          title={
            <>
              Where the growth <em>goes.</em>
            </>
          }
          description="Planned directions, presented without overstatement. Milestones, timelines and funding requirements are confirmed directly with SET."
        />
        <div className="tech-grid">
          {roadmapDirections.map((direction, i) => (
            <Reveal key={direction.title} delay={(i % 2) * 70} className="grid-reveal">
              <article className="tech-card">
                <span className="tech-card__tag">
                  <span className="eyebrow-dot" aria-hidden="true" /> Direction 0{i + 1}
                </span>
                <h3>{direction.title}</h3>
                <p>{direction.description}</p>
              </article>
            </Reveal>
          ))}
        </div>
        <div className="chipset sdg-chipset">
          <span className="chipset-label">Aligned with</span>
          {['SDG 2', 'SDG 7', 'SDG 8', 'SDG 11', 'SDG 13', 'Africa Agenda 2063'].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function Partnerships() {
  return (
    <section className="section section-alt" id="partnerships">
      <div className="container">
        <SectionHeading
          kicker="Partnerships & funding"
          title={
            <>
              Investment in a <em>cleaner tomorrow.</em>
            </>
          }
          description="We are open to conversations with funders, institutions and partners who share SET’s evidence-first, locally built approach."
        />
        <div className="focus-box focus-box--accent">
          <span className="lead">Who we work with</span>
          <div className="chipset">
            {partnershipTypes.map((type) => (
              <span key={type}>{type}</span>
            ))}
          </div>
          <span className="lead">What funding enables</span>
          <div className="focus-box__items">
            {[
              'Prototyping and testing of new mobility and energy concepts',
              'Scaling locally sourced manufacturing of validated designs',
              'Running and measuring FORGE and GreenShift training programmes',
              'Field pilots, evidence collection and honest impact reporting',
              'Growing the engineering and production team in Freetown',
            ].map((item) => (
              <div className="focus-item" key={item}>
                <CheckCircle2 size={16} aria-hidden="true" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function Cta() {
  return (
    <section className="detail-cta">
      <span className="kicker">
        <span className="eyebrow-dot" aria-hidden="true" /> Start the conversation
      </span>
      <h2>
        Invest in what works, <em>where it matters.</em>
      </h2>
      <p>
        Request the verified investor brief, speak to the founders, or propose a partnership —
        one message starts it.
      </p>
      <Button href="/contact" arrow>
        Discuss with SET
      </Button>
    </section>
  )
}

export default function InvestorsPage() {
  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <section className="detail-hero container">
          <p className="detail-category">For investors and partners</p>
          <h1>
            Back locally built <em>climate technology.</em>
          </h1>
          <p className="detail-summary">
            A youth-led Sierra Leonean company with a verified first vehicle, a disciplined
            problem-to-proof method, and a roadmap built for manufacturing, training and regional
            replication.
          </p>
        </section>
        <Opportunity />
        <TrackRecord />
        <Roadmap />
        <Partnerships />
        <Cta />
      </main>
      <Footer />
    </>
  )
}