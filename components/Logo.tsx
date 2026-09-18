import { images } from '@/lib/site'

export function Logo() {
  return (
    <a className="brand" href="/" aria-label="Sierra Electric Technologies home">
      <img
        className="brand-logo"
        src={images.logo}
        alt="Sierra Electric Technologies logo"
        width={40}
        height={40}
      />
      <span className="brand-wordmark">
        SIERRA ELECTRIC
        <b>TECHNOLOGIES</b>
      </span>
    </a>
  )
}