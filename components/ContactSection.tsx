'use client'

import { useState } from 'react'
import { ArrowRight, MapPin } from 'lucide-react'
import { Reveal } from './Reveal'
import { ADDRESS, FACEBOOK_URL, MAPS_URL } from '@/lib/site'

const interestOptions = [
  ['partnership', 'Partnering with SET'],
  ['investment', 'Investing in SET'],
  ['feedback', 'Sharing feedback'],
  ['support', 'Offering support'],
  ['donation', 'Making a donation'],
  ['research', 'Research or collaboration'],
  ['project', 'A particular project'],
  ['programme', 'A programme or training'],
  ['career', 'Careers, internships or volunteering'],
  ['media', 'Media or speaking'],
  ['other', 'Something else'],
]

export function ContactSection() {
  const [sent, setSent] = useState(false)

  function sendMessage(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    window.open(FACEBOOK_URL, '_blank', 'noopener')
    setSent(true)
  }

  return (
    <section className="section section-alt" id="contact">
      <div className="container">
        <div className="contact-grid">
          <Reveal>
            <div className="contact-intro">
              <p className="section-head__meta">
                <span className="cell-idx">01</span>
                <span className="kicker">Contact Sierra Electric Technologies</span>
              </p>
              <h2>
                Tell us what you&apos;re <em>building.</em>
              </h2>
              <p>
                Whether you want to invest, share feedback, offer support, donate, explore research,
                discuss a particular project, or partner with us, send a direct message and the SET
                team will hear from you.
              </p>
              <div className="contact-direct">
                <a
                  href={MAPS_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open SET location in Google Maps"
                >
                  <MapPin size={17} aria-hidden="true" /> {ADDRESS}
                </a>
                <a
                  href={FACEBOOK_URL}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Visit SET on Facebook"
                >
                  <span className="cap" aria-hidden="true">
                    Follow
                  </span>
                  Facebook — @sierraelectricsl
                </a>
              </div>
            </div>
          </Reveal>
          <Reveal delay={100}>
            <form className="contact-form" onSubmit={sendMessage}>
              <label htmlFor="title">
                Title
                <input id="title" name="title" required placeholder="How can we work together?" />
              </label>
              <label htmlFor="interest">
                I am interested in
                <select id="interest" name="interest" defaultValue="partnership">
                  {interestOptions.map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              <label htmlFor="message">
                Message
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={6}
                  placeholder="Tell us what you would like to build, support or explore."
                />
              </label>
              <button className="btn btn-primary btn-base" type="submit">
                <span>Send message</span>
                <ArrowRight size={15} aria-hidden="true" />
              </button>
              {sent && (
                <p className="form-note" role="status">
                  SET&apos;s Facebook page is opening in a new tab — you can send your message there
                  and the team will respond.
                </p>
              )}
            </form>
          </Reveal>
        </div>
      </div>
    </section>
  )
}