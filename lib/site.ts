export const EMAIL = 'sierraelectric.sl@gmail.com'
export const PHONE = '+23280247163'
export const FACEBOOK_URL = 'https://www.facebook.com/sierraelectricsl'
export const MAPS_URL =
  'https://maps.google.com/?q=1+Sesay+Drive+off+Fadika+Drive+Imatt+Freetown+Sierra+Leone'
export const ADDRESS = '1 Sesay Drive off Fadika Drive, Imatt, Freetown, Sierra Leone'

const CDN = 'https://hebbkx1anhila5yf.public.blob.vercel-storage.com/'

export const images = {
  logo: `${CDN}1776285047875-mvtv8fMkk7osjEWCypeWq12mH6xUoD.jpg`,
  shuttle: '/images/electric-shuttle.jpg',
  shuttleHero: `${CDN}10%20Passenger%20E%20car%20for%20Africell%20Made%20by%20Sierra%20Electric.jfif-ZaMipho7TuDliZqhJp2H8U3QOYEpNi.jpeg`,
  keke: '/images/electric-keke.jpg',
  handWashingMachine: '/images/hand-washing-machine.jpg',
  solarBackpack: '/images/solar-backpack.jpg',
  lamp: '/images/device-to-lamp.jpg',
  ceoWithMinister: '/images/ceo-with-minister.jpg',
  founderAndCo: '/images/founder-and-co.jpg',
  workshop: `${CDN}IMG-20260811-WA0016-Yig3FYAvJI3CxTFC47olxk8ZZVTkaZ.jpg`,
  engineer: `${CDN}1786993801626-l1z3FnX2M1ZM9KAvn4rafgclZAFQ7g.jpg`,
  blackVehicle: `${CDN}0f360a7e-ec58-4bb6-9d73-f39bc5d453df%20%281%29.jfif-xN5PgLAjYsfbRMkXdFvidbMRQpcTDR.jpeg`,
  specialGuest: `${CDN}1777063666742-Kd3R5Bczi6WMSLVb8JCZHOqiWD8NsJ.jpg`,
  youngBuilder: `${CDN}IMG_20260703_042354_068-NXAEgW5Ng0MzHdxAyGB27dLbaz7mGe.jpg`,
  trainingRoom: `${CDN}1777656357345-Ken8nCRx0q1CGOaUECASxo92yO2MNg.jpg`,
  panel: `${CDN}1788633531253-c3uenFU6ChUVvBRDVkEfrI0CSDUbTW.jpg`,
  workshopTeam: `${CDN}IMG-20260502-WA0077-5ezEdZC9FiA5rakFUTYGLc8j73stbx.jpg`,
  recognition: `${CDN}IMG-20260502-WA0073-YXNqhvvPqrG6BHM1KVhKmlzAv94Kks.jpg`,
  greenshiftGroup: `${CDN}1788633601074-tq50vfwHzaSJGLyUoihUUlugoDbn7d.jpg`,
  galleryExtra: `${CDN}IMG-20260503-WA0043-lyvB9V3ek7RLkUS4RGpam0jsk5iXDp.jpg`,
}

export type NavItem = { label: string; href: string; id: string }

export const nav: NavItem[] = [
  { label: 'About', href: '/about', id: 'about' },
  { label: 'Our Approach', href: '/approach', id: 'approach' },
  { label: 'The Team', href: '/team', id: 'team' },
  { label: 'Research', href: '/research', id: 'research' },
  { label: 'For Investors', href: '/investors', id: 'investors' },
  { label: 'Contact', href: '/contact', id: 'contact' },
]

export type Service = {
  number: string
  title: string
  description: string
  slug: string
}

export const services: Service[] = [
  { number: '01', title: 'Electric mobility', slug: 'electric-mobility', description: 'Electric bikes, tricycles and shuttle systems adapted for Sierra Leonean realities.' },
  { number: '02', title: 'Clean energy', slug: 'clean-energy', description: 'Solar systems, storage and energy access solutions designed for resilience.' },
  { number: '03', title: 'Smart agriculture', slug: 'smart-agriculture', description: 'Irrigation, monitoring and EV-supported farm logistics for climate resilience.' },
  { number: '04', title: 'Climate innovation', slug: 'climate-innovation', description: 'Youth-led circular economy, climate entrepreneurship and community solutions.' },
]

export type Project = {
  title: string
  tag: string
  description: string
  image?: string
  imageAlt?: string
}

function slugForTitle(title: string) {
  if (title === 'Electric Farm Vehicle SEFT-V') return 'electric-farm-vehicle-seft-v'
  return title.toLowerCase().replaceAll(' ', '-').replaceAll('—', '').replaceAll('·', '')
}

export const projects: Project[] = [
  { title: 'Electric Shuttle', tag: 'Built / mobility', image: images.shuttle, imageAlt: 'An electric shuttle minibus built by Sierra Electric Technologies', description: 'Sierra Leone’s first 100% electric shuttle minibus, with accessibility considerations and 75% locally sourced materials.' },
  { title: 'First Electric Keke', tag: 'Built / accessible mobility', image: images.keke, imageAlt: 'An electric Keke built by Sierra Electric Technologies', description: 'SET built an electric Keke that can carry passengers, including people using wheelchairs.' },
  { title: 'Solar Backpack', tag: 'Pilot / energy + education', image: images.solarBackpack, imageAlt: 'A solar-powered backpack built by Sierra Electric Technologies', description: 'A solar-generating backpack concept that supports study lighting and device charging.' },
  { title: 'Device-to-Lamp', tag: 'Circular economy', image: images.lamp, imageAlt: 'A device repurposed into a practical study lamp by Sierra Electric Technologies', description: 'Repurposing old electronic devices into practical study lamps while reducing e-waste.' },
  { title: 'GreenShift Systems', tag: 'Flagship blueprint', description: 'An integrated model connecting solar charging, electric mobility and climate-smart agriculture.' },
  { title: 'Smart Farm', tag: 'Demonstration site', description: 'A living site for solar-powered irrigation, weather monitoring, composting and crop-health research.' },
  { title: 'Electric Mini Bus', tag: 'Development direction / mobility', description: 'A larger electric public-transport direction building on SET’s shuttle and vehicle engineering work.' },
  { title: 'Automated Hand-Washing Machine', tag: 'Prototype / public health', image: images.handWashingMachine, imageAlt: 'An automated solar-powered hand-washing machine prototype', description: 'An automated hand-washing concept designed to make hygiene safer, more consistent and easier to access.' },
  { title: 'Sierra Circular Energy Initiative', tag: 'Circular energy / youth employment', description: 'A youth-led circular model repurposing mobile e-waste and solar batteries into affordable solar backpacks, lighting kits and portable charging units for underserved communities.' },
  { title: 'Electric Farm Vehicle SEFT-V', tag: 'Validated design / smart agriculture', description: 'A locally manufacturable four-wheel solar-assisted electric farm vehicle designed for approximately 500 kg of produce, tools and farm transport across rural terrain.' },
]

export function projectHref(title: string) {
  return `/projects/${slugForTitle(title)}`
}

export const featuredProject = {
  ...projects[0],
  href: '/projects/electric-shuttle',
  caseStudy: 'Sierra Leone’s first 100% electric shuttle minibus, designed and built locally with a wheelchair ramp and accessibility in mind.',
  meta: ['Electric mobility', 'Freetown, Sierra Leone'],
  status: 'Built / verified',
}

export type MediaCard = {
  kicker: string
  description: string
  image: string
  alt: string
  large?: boolean
  fit?: boolean
}

export const media: MediaCard[] = [
  { large: true, kicker: 'A visit from Pontus Edenberg', image: images.specialGuest, alt: 'A special guest visits the Sierra Electric Technologies workshop and meets the team', description: 'Pontus Edenberg, CEO of Swedish technology company Twingly, visited SET’s workshop to meet the team and see locally built electric-mobility work up close. Twingly provides API-based media intelligence data across news, blogs, forums and reviews; his visit reflects the value of connecting Sierra Leonean builders with international technology leaders.' },
  { kicker: 'GreenShift', image: images.greenshiftGroup, alt: 'GreenShift participants celebrating together in 2025', description: 'Youth climate innovators gathering, learning and building community.' },
  { kicker: 'Training in the room', image: images.trainingRoom, alt: 'SET team members and trainees working together in a training room', description: 'Practical learning, technical confidence and collaboration.' },
  { kicker: 'Workshop at Freetown Innovation Lab', image: images.workshopTeam, alt: 'SET team working around electric vehicle components in the workshop', description: 'Engineering teams examine batteries, wiring and mobility systems.' },
  { kicker: 'On television and in public', image: images.panel, alt: 'SET team members speaking on a public panel', description: 'SET’s climate and technology work reaches wider conversations.' },
  { kicker: 'Recognition and milestones', image: images.ceoWithMinister, alt: 'SET founder and CEO meeting a Minister', description: 'Team achievements that document SET’s growing ecosystem.', fit: true },
  { kicker: 'Representing SET at Youth Day', image: images.founderAndCo, alt: 'James and the co-founder representing Sierra Electric Technologies at a Youth Day programme', description: 'James Samba and the co-founder representing the team at a Youth Day programme.' },
]

export type Programme = {
  number: string
  title: string
  status: string
  description: string
  href: string
  accent?: 'leaf' | 'solar'
}

export const programmes: Programme[] = [
  { number: '01', title: 'FORGE', status: 'Status to confirm', href: '/programmes/forge', description: 'Fabrication, Operations and Roads to Green Employment. Six-week women-focused technical training concept.' },
  { number: '02', title: 'GreenShift', status: 'SET-associated initiative', href: '/programmes/greenshift', description: 'Youth climate innovation across mobility, clean energy, agriculture and community solutions.', accent: 'solar' },
]

export type Member = {
  name: string
  role: string
  bio: string
  image?: string
  alt?: string
  featured?: boolean
}

export const people: Member[] = [
  { featured: true, name: 'James Samba', role: 'Founder & CEO', image: images.engineer, alt: 'James Samba, founder of Sierra Electric Technologies, in engineering safety gear', bio: 'Founder, technology builder and 2025 MOCTI Young Innovator of the Year. His journey from experimenting with discarded electronics to electric mobility anchors SET’s culture of curiosity and practical engineering.' },
  { name: 'Ms. Mariama Salmana Bah', role: 'Co-Founder & Co-CEO', bio: 'Founder and Co-Chief Executive Officer, responsible for business development, growth, partnerships and strategic leadership across Sierra Electric Technologies Ltd. and its subsidiary venture, Speed Networks Ltd.' },
  { name: 'Samuel Samura', role: 'Administrative Officer & Software Engineer', image: images.youngBuilder, alt: 'Samuel Samura, Administrative Officer and Software Engineer at Sierra Electric Technologies', bio: 'A relentless Sierra Leonean builder and problem-solver working across engineering, technology, startups and leadership. Samuel helps turn ambitious ideas into practical systems while studying at Fourah Bay College.' },
  { name: 'Builders in the workshop', role: 'Engineering team', bio: 'Information required: confirm chief engineer, engineers, operations team, programme team, advisors and mentors.' },
  { name: 'Leadership profile', role: 'Chief Engineer & Architect', bio: 'Information required: confirm this person’s name, biography, engineering responsibilities and architectural/design role.' },
  { name: 'People behind the work', role: 'The SET team', bio: 'Information required: upload a team photo and confirm the names, roles and programme responsibilities of the wider team.' },
]

export type ImpactStat = { value: string; label: string }

export const impactStats: ImpactStat[] = [
  { value: '01', label: 'First 100% electric vehicle built in Sierra Leone' },
  { value: '75%', label: 'Locally sourced materials reported for the shuttle build' },
  { value: '2024', label: 'National Innovation Challenge winner' },
  { value: '2025', label: 'MOCTI Young Innovator of the Year recognition' },
  { value: 'Info', label: 'CO₂, jobs, trainees, beneficiaries and deployment data required for confirmation' },
  { value: 'SDGs', label: 'Aligned with SDGs 2, 7, 8, 11 and 13 and Africa Agenda 2063' },
]

export type DirectoryCard = { title: string; description: string }

export const directory: DirectoryCard[] = [
  { title: 'Research & development', description: 'EV systems, batteries, solar, agriculture technology, sensors, IoT, AI and embedded systems.' },
  { title: 'Customers & services', description: 'Current commercial products, fabrication, engineering, energy, training and consulting scope requires confirmation.' },
  { title: 'Partnerships', description: 'Government, universities, NGOs, development partners, funders, private sector and research collaborators.' },
  { title: 'Careers', description: 'Technical roles, internships, apprenticeships, volunteers and programme opportunities — availability requires confirmation.' },
  { title: 'Future roadmap', description: 'Local expansion, GreenShift pilots, manufacturing, training, regional replication and new climate technologies.' },
  { title: 'Media & press', description: 'Awards, interviews, photos, videos, press releases and downloadable press kit require confirmation and curation.' },
]

export type CareerPath = {
  title: string
  status: string
  description: string
  focus: string[]
}

export const careerPaths: CareerPath[] = [
  {
    title: 'Technical roles',
    status: 'Availability to confirm',
    description:
      'Engineering, fabrication, electric-vehicle systems, wiring, batteries, solar assembly and workshop roles built around real projects.',
    focus: ['Engineering', 'Fabrication', 'EV systems', 'Solar assembly'],
  },
  {
    title: 'Internships & apprenticeships',
    status: 'Availability to confirm',
    description:
      'Hands-on placements where young builders learn electric-vehicle, energy and fabrication skills inside live projects.',
    focus: ['Workshop practice', 'Battery systems', 'Field testing'],
  },
  {
    title: 'Programmes & training',
    status: 'Six-week concept',
    description:
      'FORGE is a six-week women-focused technical training concept; GreenShift develops youth climate innovation across sectors.',
    focus: ['Welding', 'Fabrication', 'EV wiring', 'Green employment'],
  },
  {
    title: 'Volunteers & contributors',
    status: 'Availability to confirm',
    description:
      'Mentoring, community outreach, documentation, media and programme contributions alongside the SET team.',
    focus: ['Mentoring', 'Community outreach', 'Documentation', 'Media'],
  },
]

export const skillsChips = [
  'Welding',
  'Fabrication',
  'EV wiring',
  'Solar assembly',
  'Battery systems',
  'Embedded systems',
  'Green employment',
]

export type Faq = { question: string; answer: string }

export const faqs: Faq[] = [
  { question: 'What is Sierra Electric Technologies?', answer: 'SET SL is a youth-led Sierra Leonean technology and engineering company developing practical solutions across electric mobility, clean energy, sustainable agriculture and climate innovation.' },
  { question: 'Does SET build electric vehicles?', answer: 'Yes. SET built Sierra Leone’s first 100% electric shuttle minibus and continues to develop and test electric mobility and conversion concepts.' },
  { question: 'Can organizations partner with SET?', answer: 'Yes. We welcome conversations with government, funders, NGOs, universities, businesses, technology companies and research partners.' },
  { question: 'Does SET offer training?', answer: 'SET develops technical skills and green-employment pathways. Programme availability and application windows should be confirmed directly with the team.' },
  { question: 'How can I contact SET?', answer: 'Use the contact options in the contact section below to reach the SET team.' },
]

export const processSteps: { step: string; title: string; description: string }[] = [
  { step: '01', title: 'Problem', description: 'Anchor every project in the realities people face every day.' },
  { step: '02', title: 'Research', description: 'Listen and study before engineering begins.' },
  { step: '03', title: 'Prototype', description: 'Build a working local first version, cheaply and quickly.' },
  { step: '04', title: 'Testing', description: 'Validate locally, safely and honestly.' },
  { step: '05', title: 'Deployment', description: 'Ship useful products, services and pathways.' },
  { step: '06', title: 'Impact', description: 'Measure proof, not promises.' },
]

export const rdDomains = [
  'EV systems',
  'Batteries',
  'Solar',
  'Agriculture technology',
  'Sensors',
  'IoT',
  'AI',
  'Embedded systems',
]

export const mobilityPoints: { title: string; description: string }[] = [
  { title: 'Shuttle EV / 01', description: 'Sierra Leone’s first 100% electric shuttle minibus, built locally with accessibility in mind.' },
  { title: 'Electric Keke', description: 'An electric conversion that carries passengers, including people using wheelchairs.' },
  { title: 'Electric Mini Bus', description: 'A larger public-transport direction building on SET’s shuttle and vehicle engineering work.' },
  { title: 'SEFT-V farm vehicle', description: 'A locally manufacturable, solar-assisted four-wheel electric farm vehicle for rural transport.' },
]

export const energyPoints: { title: string; description: string }[] = [
  { title: 'Solar Backpack', description: 'A solar-generating backpack concept supporting study lighting and device charging.' },
  { title: 'Device-to-Lamp', description: 'Repurposing old electronic devices into practical study lamps while reducing e-waste.' },
  { title: 'Smart Farm', description: 'Solar-powered irrigation, weather monitoring, composting and crop-health research.' },
  { title: 'Circular Energy Initiative', description: 'Recovering e-waste and solar batteries into affordable lighting kits and charging units.' },
]