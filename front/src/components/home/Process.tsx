import type { CSSProperties } from 'react'
import { Send } from 'lucide-react'

import { ButtonLink } from '@/components/ui/Button'
import { Reveal } from '@/components/ui/Reveal'
import { SplitText } from '@/components/ui/SplitText'
import type { ProcessStep } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { pad, telegramChat, type SocialProfile } from '@/lib/text'

/** Length of the timeline the steps are laid out on, in days. */
const DAYS = 7
const DAY_NUMBERS = Array.from({ length: DAYS }, (_, index) => index + 1)

/** "День 1" → [1, 1], "Дні 4–6" → [4, 6]; null for "після запуску" and other open-ended steps. */
function dayRange(duration: string): [number, number] | null {
  const match = /(\d+)(?:\s*[–-]\s*(\d+))?/.exec(duration)
  if (!match) return null
  const first = Math.min(Math.max(Number(match[1]), 1), DAYS)
  return [first, Math.min(Math.max(Number(match[2] ?? match[1]), first), DAYS)]
}

/**
 * How we work, as the page's loudest block: an inverted full-width panel with
 * the steps drawn as bars on a 7-day timeline, so a visitor sees at a glance
 * what happens on which day. Steps without days (support) run past the end.
 */
export function Process({ steps, telegram }: { steps: ProcessStep[]; telegram: SocialProfile | null }) {
  const t = useT()

  return (
    <section
      id="process"
      aria-labelledby="process-heading"
      className="scroll-mt-20 bg-inverse px-4 py-24 text-inverse-foreground sm:px-6 lg:px-10 lg:py-32"
    >
      <div className="mx-auto max-w-[90rem]">
        <header className="grid gap-8 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-7">
            <p className="label opacity-75">
              <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden="true" />
              {t.nav.process}
            </p>
            <SplitText
              as="h2"
              id="process-heading"
              text={t.process.title}
              className="mt-6 font-display text-[clamp(2.75rem,6.5vw,6rem)] leading-[0.98] font-medium tracking-[-0.045em]"
            />
          </div>
          <Reveal delay={200} className="lg:col-span-5">
            <p className="font-display text-2xl leading-tight font-medium tracking-tight text-balance lg:text-3xl">
              {t.process.leadBefore}
              <span className="marker">{t.process.leadMarked}</span>
            </p>
            <p className="mt-4 max-w-md text-pretty opacity-80 lg:text-lg">{t.process.intro}</p>
          </Reveal>
        </header>

        <div className="mt-16 lg:mt-24">
          {/* Day ruler, aligned with the bars below. */}
          <div aria-hidden="true" className="hidden border-b border-current/15 pb-3 lg:grid lg:grid-cols-12">
            <div className="label grid grid-cols-7 opacity-75 lg:col-span-7 lg:col-start-6">
              {DAY_NUMBERS.map((day) => (
                <span key={day} className="pl-2">
                  {t.process.day(day)}
                </span>
              ))}
            </div>
          </div>

          <ol>
            {steps.map((step, index) => {
              const range = dayRange(step.duration)
              return (
                <Reveal
                  as="li"
                  key={step.id}
                  delay={index * 90}
                  className="grid gap-4 border-b border-current/15 py-7 lg:grid-cols-12 lg:items-center lg:gap-8"
                >
                  <div className="lg:col-span-5">
                    <h3 className="flex items-baseline gap-4 font-display text-2xl font-medium tracking-tight lg:text-[1.75rem]">
                      <span className="label opacity-75">{pad(index + 1)}</span>
                      {step.title}
                    </h3>
                    {/* Phones get the timing as a marker; the bars need the wide layout to read. */}
                    {step.duration ? (
                      <p className="label mt-3 lg:hidden">
                        <span className="marker">{step.duration}</span>
                      </p>
                    ) : null}
                    {step.description ? (
                      <p className="mt-2 max-w-md text-[0.95rem] leading-relaxed text-pretty opacity-80 lg:pl-10">
                        {step.description}
                      </p>
                    ) : null}
                  </div>

                  <div className="relative hidden h-11 grid-cols-7 lg:col-span-7 lg:grid">
                    {/* Faint day cells behind the bar. */}
                    {DAY_NUMBERS.map((day) => (
                      <span key={day} aria-hidden="true" className="border-l border-current/10" />
                    ))}
                    <span
                      className={
                        range
                          ? 'process-bar label absolute inset-y-0 flex items-center rounded-full bg-primary px-4 whitespace-nowrap text-primary-foreground'
                          : 'process-bar label absolute inset-y-0 right-0 left-0 flex items-center justify-end rounded-full border border-dashed border-current/40 px-4 whitespace-nowrap'
                      }
                      style={
                        range
                          ? ({
                              left: `calc(${((range[0] - 1) / DAYS) * 100}% + 2px)`,
                              width: `calc(${((range[1] - range[0] + 1) / DAYS) * 100}% - 4px)`,
                            } as CSSProperties)
                          : undefined
                      }
                    >
                      {step.duration}
                    </span>
                  </div>
                </Reveal>
              )
            })}
          </ol>
        </div>

        {telegram ? (
          <Reveal className="mt-14 flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:gap-6">
            <ButtonLink
              size="lg"
              href={telegramChat(telegram.url, t.telegram.message)}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="h-5 w-5" aria-hidden="true" />
              {t.process.start}
            </ButtonLink>
            <p className="max-w-sm text-sm opacity-80">{t.process.startNote}</p>
          </Reveal>
        ) : null}
      </div>
    </section>
  )
}
