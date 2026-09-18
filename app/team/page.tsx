import { ArrowRight } from 'lucide-react'
import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { Button } from '@/components/Button'
import { Badge } from '@/components/Badge'
import { Reveal } from '@/components/Reveal'
import { careerPaths, images, media, people, skillsChips } from '@/lib/site'

export const metadata = {
  title: 'The Team | Sierra Electric Technologies',
  description:
    'The young engineers, administrators and builders behind SET — plus training pathways, internships, apprenticeships and ways to join the work.',
}

function People() {
  return (
    <section className="section container" id="people">
      <SectionHeading
        kicker="People"
        title={
          <>
            The builders behind <em>the builds.</em>
          </>
        }
        description="A small team of young engineers, administrators and builders in Freetown. Profiles for missing roles are confirmed directly with SET."
      />
      <div className="team-grid">
        {people.map((person, i) => (
          <Reveal key={person.name} delay={(i % 3) * 70} className="grid-reveal">
            <article className={`member-card ${person.featured ? 'member-card--featured' : ''}`}>
              <div className={`member-photo ${person.image ? 'member-photo--portrait' : ''}`}>
                {person.image ? (
                  <img
                    src={person.image}
                    alt={person.alt ?? person.name}
                    loading="lazy"
                    className={person.featured ? 'img--round' : undefined}
                  />
                ) : (
                  <div className="member-placeholder">
                    <span>Figure to be supplied</span>
                  </div>
                )}
              </div>
              <div className="member-copy">
                <span className="kicker">{person.role}</span>
                <h3>{person.name}</h3>
                <p>{person.bio}</p>
              </div>
            </article>
          </Reveal>
        ))}
      </div>

      <div className="workspace-strip">
        <Reveal>
          <p className="section-head__meta">
            <span className="cell-idx" aria-hidden="true" />
            <span className="kicker">02 · In the workshop</span>
          </p>
          <h3>Where the work happens.</h3>
          <p>
            Batteries, wiring, frames and prototypes come together at SET&apos;s Freetown workshop
            and in a training room built for practical learning.
          </p>
        </Reveal>
        <div className="workspace-images">
          <img src={images.workshop} alt="Inside the SET workshop" loading="lazy" />
          <img src={images.trainingRoom} alt="SET training room in session" loading="lazy" />
          <img src={images.workshopTeam} alt="SET team around electric vehicle components" loading="lazy" />
        </div>
      </div>
    </section>
  )
}

function MediaJournal() {
  const [featured, ...rest] = media
  return (
    <section className="section section-alt" id="media">
      <div className="container">
        <SectionHeading
          kicker="Stories from the field"
          title={
            <>
              SET in motion, <em>in the room.</em>
            </>
          }
        >
          <Button href="/contact" variant="ghost" size="sm" arrow>
            Share a story
          </Button>
        </SectionHeading>
        <div className="journal-grid">
          <Reveal className="grid-reveal">
            <article className="journal-card journal-card--large">
              <img src={featured.image} alt={featured.alt} loading="lazy" />
              <div className="journal-card__body">
                <span className="kicker">{featured.kicker}</span>
                <p>{featured.description}</p>
              </div>
            </article>
          </Reveal>
          {rest.map((card, i) => (
            <Reveal key={card.kicker} delay={(i % 2) * 70} className="grid-reveal">
              <article className="journal-card">
                <img src={card.image} alt={card.alt} loading="lazy" />
                <div className="journal-card__body">
                  <span className="kicker">{card.kicker}</span>
                  <p>{card.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}

function WorkWithUs() {
  return (
    <section className="section" id="work">
      <div className="container">
        <SectionHeading
          kicker="Work with SET"
          title={
            <>
              Paths into the <em>greener economy.</em>
            </>
          }
          description="SET develops technical skills and green-employment pathways. Specific openings and application windows are confirmed directly with the team."
        />
        <div className="career-grid">
          {careerPaths.map((path, i) => (
            <Reveal key={path.title} delay={i * 60} className="grid-reveal">
              <article className="career-card">
                <span className="career-card__num">0{i + 1}</span>
                <Badge>{path.status}</Badge>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <div className="career-card__focus">
                  {path.focus.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="focus-box">
          <span className="lead">Skills we build</span>
          <p className="focus-note">
            Learning at SET happens in the workshop and in the field, across the disciplines a
            climate-technology company needs.
          </p>
        </div>
        <div className="skills-strip">
          {skillsChips.map((skill) => (
            <span key={skill}>{skill}</span>
          ))}
        </div>
      </div>
    </section>
  )
}

function JoinSteps() {
  const steps = [
    {
      title: 'Reach out',
      description:
        'Send a message through the contact page with your name, area of interest and where you are based.',
    },
    {
      title: 'Share your background',
      description:
        'Tell SET about your skills, projects, study or workshop experience — demonstration matters more than certificates.',
    },
    {
      title: 'Confirm availability',
      description:
        'The team confirms current openings, programme windows and next steps directly, honestly and on time.',
    },
  ]
  return (
    <section className="section section-alt" id="join">
      <div className="container">
        <SectionHeading
          kicker="How to join"
          title={
            <>
              Three steps to <em>start.</em>
            </>
          }
        />
        <div className="process-grid">
          {steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 60} className="grid-reveal">
              <div className="process-step">
                <span className="process-step__num">STEP 0{i + 1}</span>
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
        <span className="eyebrow-dot" aria-hidden="true" /> Start the conversation
      </span>
      <h2>
        Your pathway starts <em>with a message.</em>
      </h2>
      <p>
        Whether you want to learn, build, mentor or collaborate, the SET team will respond.
      </p>
      <Button href="/contact" arrow>
        Message the team
      </Button>
    </section>
  )
}

export default function TeamPage() {
  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <section className="detail-hero container">
          <p className="detail-category">The team and people</p>
          <h1>
            Young builders, <em>real skills.</em>
          </h1>
          <p className="detail-summary">
            From six-week training concepts to welding, fabrication, EV wiring, solar assembly and
            engineering roles — SET is a home for young builders who grow with real projects.
          </p>
        </section>
        <People />
        <MediaJournal />
        <WorkWithUs />
        <JoinSteps />
        <Cta />
      </main>
      <Footer />
    </>
  )
}