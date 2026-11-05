import { useState, type FormEvent } from 'react'

import { Button } from '@/components/ui/Button'
import { Link } from '@/components/ui/Link'
import { ApiError, subscribe } from '@/lib/api'
import { STRINGS, useLang } from '@/lib/i18n'

type Status = 'idle' | 'sending' | 'sent'

/** Email sign-up under the blog list. Addresses land in the admin («Підписники розсилки»). */
export function Newsletter() {
  const lang = useLang()
  const t = STRINGS[lang]
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<Status>('idle')
  const [error, setError] = useState('')

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setStatus('sending')
    setError('')

    try {
      await subscribe(email, lang)
      setStatus('sent')
    } catch (failure) {
      setStatus('idle')
      setError(
        failure instanceof ApiError ? (failure.fields.email ?? failure.message) : t.newsletter.error,
      )
    }
  }

  return (
    <section aria-labelledby="newsletter-heading" className="bg-muted px-4 py-16 sm:px-6 lg:px-10 lg:py-18">
      <div className="mx-auto flex max-w-[90rem] flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="label flex items-center gap-3 text-muted-foreground">
            <span className="h-1.5 w-7 bg-primary" aria-hidden="true" />
            {t.newsletter.label}
          </p>
          <h2
            id="newsletter-heading"
            className="mt-4 font-display text-[clamp(1.75rem,3.2vw,2.75rem)] leading-[1.05] font-medium tracking-[-0.035em]"
          >
            {t.newsletter.title}
          </h2>
        </div>

        {status === 'sent' ? (
          <p role="status" className="text-lg font-medium">
            {t.newsletter.sent(email)}
          </p>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="w-full lg:w-auto">
            <div className="flex">
              <label className="sr-only" htmlFor="newsletter-email">
                Email
              </label>
              <input
                id="newsletter-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="your@email.com"
                aria-invalid={error ? true : undefined}
                aria-describedby={error ? 'newsletter-error' : undefined}
                className="h-14 min-w-0 flex-1 border border-r-0 border-foreground bg-card px-4.5 outline-none placeholder:text-muted-foreground focus-visible:outline-none lg:w-95 lg:flex-none"
              />
              <Button type="submit" variant="inverse" size="lg" disabled={status === 'sending'} className="rounded-none">
                {status === 'sending' ? t.newsletter.sending : t.newsletter.submit}
              </Button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {t.newsletter.consent}{' '}
              <Link href="/privacy/" className="underline underline-offset-2 hover:text-foreground">
                {t.form.privacy}
              </Link>
            </p>
            {error ? (
              <p id="newsletter-error" role="alert" className="mt-2 text-sm text-danger">
                {error}
              </p>
            ) : null}
          </form>
        )}
      </div>
    </section>
  )
}
