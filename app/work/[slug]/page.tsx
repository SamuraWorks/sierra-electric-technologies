import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'

const services = {
  'electric-mobility': {
    title: 'Electric mobility',
    summary: 'Electric bikes, tricycles and shuttle systems adapted for Sierra Leonean realities.',
    details: [
      'SET explores practical electric transport across bikes, tricycles, shuttles, mini-buses and farm vehicles.',
      'The work connects local fabrication, battery systems, drivetrain design, charging, accessibility and maintainability.',
      'The first electric Keke is designed to carry passengers, including wheelchair users, while the SET / EV-01 shuttle demonstrates locally built electric transport.',
      'Future work includes electric mini-bus development, fleet partnerships, charging infrastructure and field validation.',
    ],
    focus: [
      'Vehicle conversion and prototype engineering',
      'Wheelchair-accessible passenger mobility',
      'Electric shuttle and mini-bus systems',
      'Locally serviceable charging and battery systems',
    ],
  },
  'clean-energy': {
    title: 'Clean energy',
    summary: 'Solar systems, storage and energy access solutions designed for resilience.',
    details: [
      'SET develops clean-energy concepts that connect solar generation, storage, lighting and productive use.',
      'The Sierra Circular Energy Initiative repurposes usable battery cells from mobile devices and small solar systems into affordable backpacks, lighting kits and charging units.',
      'Solar-powered school backpacks, created with Wanjama Innovative Salone since 2021, support study lighting and device charging in off-grid communities.',
      'The approach prioritizes safety, repairability, local skills and reliable energy access for households, schools and small businesses.',
    ],
    focus: [
      'Solar generation and storage',
      'Battery recovery and safe testing',
      'Solar school backpacks',
      'Portable lighting and charging',
    ],
  },
  'smart-agriculture': {
    title: 'Smart agriculture',
    summary: 'Irrigation, monitoring and EV-supported farm logistics for climate resilience.',
    details: [
      'SET combines solar-powered irrigation, weather monitoring, composting and crop-health research in practical demonstration environments.',
      'The Electric Farm Vehicle SEFT-V is a four-wheel electric farm cart designed for produce, tools and people across rural terrain.',
      'The validated concept targets approximately 500 kilograms of load capacity, a 72-volt lithium-ion battery, an axle-driven motor and assistive solar charging.',
      'The design emphasizes local manufacturing, simple maintenance and lower dependence on fuel for smallholder farmers.',
    ],
    focus: [
      'Solar irrigation and water resilience',
      'Weather and crop monitoring',
      'Electric farm logistics',
      'Local manufacturing and maintenance',
    ],
  },
  'climate-innovation': {
    title: 'Climate innovation',
    summary: 'Youth-led circular economy, climate entrepreneurship and community solutions.',
    details: [
      'SET gives young builders a pathway from local problem identification to prototype, enterprise and deployment.',
      'The Sierra Circular Energy Initiative creates roles for youth collectors and technicians in e-waste recovery, battery testing and solar product assembly.',
      'Climate innovation spans electric mobility, clean energy, agriculture, circular design and community-based enterprise.',
      'The work is designed to grow through partnerships, training, local production and evidence from field pilots.',
    ],
    focus: [
      'Youth technical training and employment',
      'Circular economy and e-waste recovery',
      'Climate entrepreneurship',
      'Community-led prototypes and partnerships',
    ],
  },
} as const

export function generateStaticParams() {
  return Object.keys(services).map((slug) => ({ slug }))
}

export default async function WorkPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const service = services[slug as keyof typeof services] ?? services['electric-mobility']

  return (
    <>
      <Navbar />
      <main>
        <section className="detail-hero container">
          <Link className="btn btn-text" href="/approach">
            <ArrowLeft size={15} aria-hidden="true" /> Back to what we do
          </Link>
          <p className="detail-category">SET capability</p>
          <h1>{service.title}</h1>
          <p className="detail-summary">{service.summary}</p>
        </section>

        <section className="section">
          <div className="container">
            <div className="detail-body">
              <div className="detail-intro">
                <p className="section-head__meta">
                  <span className="cell-idx">Approach</span>
                  <span className="kicker">Our approach</span>
                </p>
                <h2>
                  Technology made for <em>real-world impact.</em>
                </h2>
              </div>
              <div className="detail-copy">
                {service.details.map((detail) => (
                  <article key={detail}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <p>{detail}</p>
                  </article>
                ))}
                <div className="focus-box">
                  <span className="lead">What this includes</span>
                  {service.focus.map((item) => (
                    <div className="focus-item" key={item}>
                      <CheckCircle2 size={16} aria-hidden="true" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

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
          <Link className="btn btn-primary" href="/contact">
            <span>Talk to SET</span>
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
  const service = services[slug as keyof typeof services] ?? services['electric-mobility']
  return { title: service.title, description: service.summary }
}