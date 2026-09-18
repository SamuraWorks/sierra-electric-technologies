import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { SectionHeading } from '@/components/SectionHeading'
import { ContactSection } from '@/components/ContactSection'
import { faqs } from '@/lib/site'

export const metadata = {
  title: 'Contact | Sierra Electric Technologies',
  description:
    'Partner, invest, support, research or join Sierra Electric Technologies. Reach the SET team directly with a message.',
}

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <main id="main" tabIndex={-1}>
        <section className="detail-hero container">
          <p className="detail-category">Contact Sierra Electric Technologies</p>
          <h1>
            Tell us what you&apos;re <em>building.</em>
          </h1>
          <p className="detail-summary">
            Partnerships, investment, feedback, support, research and careers all start with one
            message. Pick the topic that fits and the SET team will be in touch.
          </p>
        </section>

        <ContactSection />

        <section className="section" id="faq">
          <div className="container">
            <SectionHeading
              index="02"
              kicker="Frequently asked questions"
              title={
                <>
                  Start with the <em>facts.</em>
                </>
              }
            />
            <div className="faq-list">
              {faqs.map((faq) => (
                <details key={faq.question}>
                  <summary>
                    {faq.question}
                    <span className="plus" aria-hidden="true">
                      +
                    </span>
                  </summary>
                  <p>{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}