import { Check } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Reveal } from '@/components/Reveal'
import { directory } from '@/lib/site'

export const metadata = {
  title: 'About | Sierra Electric Technologies',
  description:
    'Sierra Electric Technologies is a youth-led Sierra Leonean technology and engineering company building practical climate, mobility, energy and agriculture solutions.',
}

function Story() {
  return (
    <section className="section container" id="about">
      <div className="about-grid">
        <div className="about-intro">
          <Reveal>
            <p className="section-head__meta">
              <span className="cell-idx">01</span>
              <span className="kicker">Who we are</span>
            </p>
            <h2>
              Local problems deserve <em>local engineering.</em>
            </h2>
            <p>
              A youth-led climate-technology and engineering company headquartered in Freetown,
              Sierra Leone — and building for Africa.
            </p>
          </Reveal>
        </div>
        <Reveal delay={80}>
          <div className="about-detail">
            <p>
              Incorporated on <strong>29 July 2023</strong>, Sierra Electric Technologies Ltd. is a
              youth-led climate-technology and engineering company headquartered in Freetown, Sierra
              Leone. Its subsidiary venture, <strong>Speed Networks Ltd.</strong>, expands the
              business beyond a single product line.
            </p>
            <p>
              We design and build practical solutions for the realities people face every day:
              expensive fuel, unreliable electricity, difficult rural transport, growing e-waste and
              climate pressure on food systems. Our work connects electric mobility, solar energy,
              circular design, smart agriculture and skills development — and led by young builders,
              SET has already built Sierra Leone&apos;s first 100% electric vehicle.
            </p>
            <p>
              SET moves deliberately from listening and research to engineering, prototyping, testing
              and deployment. We work with young builders, communities, institutions and partners to
              turn local challenges into useful products, services and pathways to green employment
              across Sierra Leone and Africa.
            </p>
          </div>
          <div className="about-facts">
            <div>
              <span className="mono">Established</span>
              <b>29 July 2023</b>
              <span>Incorporated in Freetown, Sierra Leone</span>
            </div>
            <div>
              <span className="mono">Firsts</span>
              <b>100% electric shuttle</b>
              <span>Sierra Leone&apos;s first electric vehicle, built locally</span>
            </div>
            <div>
              <span className="mono">Recognition</span>
              <b>2024 · 2025</b>
              <span>National Innovation Challenge winner and MOCTI Young Innovator</span>
            </div>
          </div>
          <div className="verified">
            <span className="verified__label">
              <Check size={15} aria-hidden="true" /> Verified and recognised
            </span>
            <ul>
              <li>
                <Check size={15} aria-hidden="true" /> <strong>75%</strong> locally sourced shuttle
                build
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> 2024 National Innovation Challenge winner
              </li>
              <li>
                <Check size={15} aria-hidden="true" /> 2025 MOCTI Young Innovator of the Year
                recognition
              </li>
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  )
}

function DirectorySection() {
  return (
    <section className="section section-alt" id="directory">
      <div className="container">
        <SectionHeading
          index="02"
          kicker="Everything a partner needs"
          title={
            <>
              A transparent <em>institutional profile.</em>
            </>
          }
          description="Scope, partnerships, careers, roadmap, media and customers — presented plainly, with confirmation markers where SET is still verifying details."
        />
        <div className="directory-grid">
          {directory.map((card, i) => (
            <Reveal key={card.title} delay={(i % 3) * 60} className="grid-reveal">
              <article className="directory-card">
                <h3>{card.title}</h3>
                <p>{card.description}</p>
                <Badge>Information / status to confirm</Badge>
              </article>
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
        <span className="eyebrow-dot" aria-hidden="true" /> Work with SET
      </span>
      <h2>
        Meet the team or <em>start something.</em>
      </h2>
      <p>
        Partnerships, research, media and support conversations start with one message.
      </p>
      <Button href="/contact" arrow>
        Contact SET
      </Button>
    </section>
  )
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main>
        <section className="detail-hero container">
          <p className="detail-category">About Sierra Electric Technologies</p>
          <h1>
            Engineering a future <em>worth believing in.</em>
          </h1>
          <p className="detail-summary">
            Sierra Electric Technologies is a youth-led Sierra Leonean technology and engineering
            company building practical solutions — from electric mobility and clean energy to smart
            agriculture and climate innovation.
          </p>
        </section>
        <Story />
        <DirectorySection />
        <Cta />
      </main>
      <Footer />
    </>
  )
}