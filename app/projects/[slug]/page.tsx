import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { projectHref, projects } from '@/lib/site'

const projectDetails: Record<string, { details: string[]; focus: string[] }> = {
  'Electric Shuttle': {
    details: [
      'SET built Sierra Leone’s first 100% electric shuttle minibus, designed and built locally.',
      'The build includes accessibility considerations, a wheelchair ramp and a focus on practical, serviceable transport.',
      '75% of the shuttle build is reported to use locally sourced materials.',
      'The shuttle is the flagship of SET’s electric-mobility work and the reference build for future directions like the electric mini-bus.',
    ],
    focus: [
      'Electric mobility',
      'Accessibility considerations',
      'Locally sourced build',
      'Public transport direction',
    ],
  },
  'First Electric Keke': {
    details: [
      'SET built an electric Keke that can carry passengers, including people using wheelchairs.',
      'The conversion builds on tricycle conversion work adapted to Sierra Leonean roads and charging reality.',
      'It sits alongside the SET / EV-01 shuttle in SET’s accessible electric-mobility family.',
    ],
    focus: [
      'Accessible passenger mobility',
      'Electric conversion',
      'Tricycle platform',
    ],
  },
  'Solar Backpack': {
    details: [
      'A solar-generating backpack concept that supports study lighting and device charging.',
      'Designed for education and energy access in off-grid communities.',
      'The concept connects with the Sierra Circular Energy Initiative’s affordable energy products.',
    ],
    focus: [
      'Solar generation',
      'Study lighting',
      'Device charging',
      'Education and youth',
    ],
  },
  'Device-to-Lamp': {
    details: [
      'Repurposing old electronic devices into practical study lamps while reducing e-waste.',
      'Turns discarded devices into useful lighting for study and home use.',
      'Part of SET’s circular-economy work alongside battery recovery and repurposing.',
    ],
    focus: [
      'E-waste reduction',
      'Study lamps',
      'Circular design',
    ],
  },
  'GreenShift Systems': {
    details: [
      'An integrated model connecting solar charging, electric mobility and climate-smart agriculture.',
      'A flagship blueprint that ties SET’s systems together into one deployable package.',
      'Presented as a developed blueprint; delivery details and outcomes require confirmation.',
    ],
    focus: [
      'Integrated systems',
      'Solar charging',
      'Climate-smart agriculture',
    ],
  },
  'Smart Farm': {
    details: [
      'A living site for solar-powered irrigation, weather monitoring, composting and crop-health research.',
      'A demonstration site where hands-on learning and research come together.',
      'Supports SET’s smart-agriculture and climate-resilience work.',
    ],
    focus: [
      'Solar-powered irrigation',
      'Weather monitoring',
      'Composting',
      'Crop-health research',
    ],
  },
  'Electric Mini Bus': {
    details: [
      'A larger electric public-transport direction building on SET’s shuttle and vehicle engineering work.',
      'Development direction — recorded honestly as not yet a delivered build.',
      'Answers a growing need for affordable, climate-friendly public transport.',
    ],
    focus: [
      'Public transport',
      'Larger vehicle platform',
      'Shuttle lineage',
    ],
  },
  'Automated Hand-Washing Machine': {
    details: [
      'An automated hand-washing concept designed to make hygiene safer, more consistent and easier to access.',
      'Prototype stage — an example of SET applying engineering skills to public health.',
      'Part of the wider portfolio of local problem-solving beyond mobility and energy.',
    ],
    focus: [
      'Public health',
      'Automation',
      'Prototype',
    ],
  },
  'Sierra Circular Energy Initiative': {
    details: [
      'A youth-led circular model repurposing mobile e-waste and solar batteries into affordable solar backpacks, lighting kits and portable charging units for underserved communities.',
      'Creates technical and collection roles for youth, connecting e-waste recovery with green employment.',
      'Central to SET’s climate-innovation and GreenShift work.',
    ],
    focus: [
      'E-waste recovery',
      'Battery repurposing',
      'Youth employment',
      'Solar backpacks and lighting',
    ],
  },
  'Electric Farm Vehicle SEFT-V': {
    details: [
      'A locally manufacturable four-wheel solar-assisted electric farm vehicle designed for approximately 500 kg of produce, tools and farm transport across rural terrain.',
      'The validated concept targets a 72-volt lithium-ion battery, an axle-driven motor and assistive solar charging.',
      'Emphasizes local manufacturing, simple maintenance and lower dependence on fuel for smallholder farmers.',
    ],
    focus: [
      'Farm logistics',
      'Solar-assisted charging',
      'Local manufacturing',
      'Maintenance simplicity',
    ],
  },
}

export function generateStaticParams() {
  return projects.map((project) => ({
    slug: projectHref(project.title).replace('/projects/', ''),
  }))
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = projects.find((p) => projectHref(p.title).endsWith(slug)) ?? projects[0]
  const details =
    projectDetails[project.title] ?? {
      details: [project.description],
      focus: [project.tag],
    }

  return (
    <>
      <Navbar />
      <main>
        <section className="detail-hero container">
          <Link className="btn btn-text" href="/research">
            <ArrowLeft size={15} aria-hidden="true" /> Back to research
          </Link>
          <p className="detail-category">{project.tag}</p>
          <h1>{project.title}</h1>
          <p className="detail-summary">{project.description}</p>
        </section>

        <section className="section">
          <div className="container">
            <div className="detail-body">
              <div className="detail-intro">
                <p className="section-head__meta">
                  <span className="cell-idx">Project</span>
                  <span className="kicker">The file</span>
                </p>
                <h2>
                  What this record <em>covers.</em>
                </h2>
              </div>
              <div className="detail-copy">
                {details.details.map((detail) => (
                  <article key={detail}>
                    <CheckCircle2 size={18} aria-hidden="true" />
                    <p>{detail}</p>
                  </article>
                ))}
                <div className="focus-box">
                  <span className="lead">In this record</span>
                  {details.focus.map((item) => (
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
            <span className="eyebrow-dot" aria-hidden="true" /> Partner with SET
          </span>
          <h2>
            Let&apos;s build the <em>next one together.</em>
          </h2>
          <p>
            Request the verified project brief, references or partnership options from the team.
          </p>
          <Link className="btn btn-primary" href="/contact">
            <span>Start a conversation</span>
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
  const project = projects.find((p) => projectHref(p.title).endsWith(slug)) ?? projects[0]
  return { title: project.title, description: project.description }
}