import Link from 'next/link'
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react'

const logo = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/1776285047875-mvtv8fMkk7osjEWCypeWq12mH6xUoD.jpg'
const programmes = {
  forge: { title: 'FORGE', category: 'Women · fabrication · green employment', summary: 'Fabrication, Operations and Roads to Green Employment: a practical pathway for women into welding, fabrication, EV wiring and technical work.', details: ['Six-week women-focused technical training concept.', 'Hands-on learning designed around tools, workshop confidence and employable skills.', 'Programme dates, cohort size, partners and application process require confirmation.'] },
  greenshift: { title: 'GreenShift', category: 'Youth · climate innovation · systems', summary: 'A youth-led climate innovation platform connecting electric mobility, clean energy, agriculture and community solutions.', details: ['Connects prototypes with climate entrepreneurship and green employment.', 'Creates space for young people to test practical solutions for Sierra Leone and Africa.', 'Programme partners, delivered projects, dates and outcomes require confirmation.'] },
} as const

export function generateStaticParams() { return Object.keys(programmes).map((slug) => ({ slug })) }

export default async function ProgrammePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const programme = programmes[slug as keyof typeof programmes] ?? programmes.greenshift
  return <main className="project-detail-page"><header className="site-header"><Link className="brand" href="/"><img className="brand-logo" src={logo} alt="Sierra Electric Technologies logo" /><span>SIERRA ELECTRIC<br /><b>TECHNOLOGIES</b></span></Link><Link className="pill-button outline" href="/#programmes"><ArrowLeft size={15} /> Back to programmes</Link></header><section className="project-detail-hero section-pad"><span className="eyebrow"><span className="eyebrow-dot" /> Programme profile</span><p className="project-detail-category">{programme.category}</p><h1>{programme.title}</h1><p className="project-detail-summary">{programme.summary}</p></section><section className="project-detail-body section-pad"><div className="project-detail-intro"><span className="kicker">The programme</span><h2>Skills for a <em>greener future.</em></h2></div><div className="project-detail-copy">{programme.details.map((detail) => <article key={detail}><CheckCircle2 size={18} /><p>{detail}</p></article>)}</div></section><section className="project-detail-cta section-pad"><span className="kicker">Partner with SET</span><h2>Help build what <em>comes next.</em></h2><p>Contact the team for the verified programme brief, partnership options, participation details and current availability.</p><Link className="pill-button primary" href="/#contact">Discuss the programme <ArrowRight size={16} /></Link></section></main>
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) { const { slug } = await params; const programme = programmes[slug as keyof typeof programmes] ?? programmes.greenshift; return { title: `${programme.title} | Sierra Electric Technologies`, description: programme.summary } }
