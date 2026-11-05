import { ArrowLeft, ArrowUpRight } from 'lucide-react'

import { CaseMedia } from '@/components/cases/CaseMedia'
import { ButtonLink } from '@/components/ui/Button'
import { Counter } from '@/components/ui/Counter'
import { Link } from '@/components/ui/Link'
import { Reveal } from '@/components/ui/Reveal'
import { SplitText } from '@/components/ui/SplitText'
import type { Project, Service } from '@/lib/api'
import { caseUrl, serviceUrl } from '@/lib/router'
import { paragraphs } from '@/lib/text'
import { useT } from '@/lib/i18n'

interface CasePageProps {
  project: Project
  next: Project | null
  /** The service this case belongs to, linked from its details. */
  service: Service | null
}

const STORY = ['challenge', 'solution', 'result'] as const

export function CasePage({ project, next, service }: CasePageProps) {
  const t = useT()
  const meta = [
    { label: t.casePage.client, value: project.client },
    { label: t.casePage.year, value: project.year ? String(project.year) : '' },
    { label: t.casePage.category, value: project.category },
  ].filter((item) => item.value)

  return (
    <article aria-labelledby="case-heading">
      <header className="px-4 pt-28 sm:px-6 lg:px-10 lg:pt-36">
        <div className="mx-auto max-w-[90rem]">
          <Link
            href="/#projects"
            className="label inline-flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            {t.casePage.all}
          </Link>

          <SplitText
            as="h1"
            id="case-heading"
            text={project.title}
            className="mt-10 max-w-[18ch] font-display text-[clamp(2.5rem,7vw,7.5rem)] leading-[0.98] font-medium tracking-[-0.045em]"
          />

          <div className="mt-12 grid gap-10 border-t border-border pt-8 lg:grid-cols-12">
            {project.description ? (
              <Reveal className="lg:col-span-6">
                <p className="text-xl leading-relaxed text-pretty lg:text-2xl">{project.description}</p>
              </Reveal>
            ) : null}

            <Reveal as="dl" delay={120} className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:col-span-5 lg:col-start-8">
              {meta.map((item) => (
                <div key={item.label}>
                  <dt className="label text-muted-foreground">{item.label}</dt>
                  <dd className="mt-2">{item.value}</dd>
                </div>
              ))}
              {service ? (
                <div>
                  <dt className="label text-muted-foreground">{t.casePage.service}</dt>
                  <dd className="mt-2">
                    <Link href={serviceUrl(service.slug)} className="underline underline-offset-4">
                      {service.title}
                    </Link>
                  </dd>
                </div>
              ) : null}
              {project.url ? (
                <div>
                  <dt className="label text-muted-foreground">{t.casePage.site}</dt>
                  <dd className="mt-2">
                    <a
                      href={project.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 underline underline-offset-4"
                    >
                      {new URL(project.url).hostname}
                      <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                    </a>
                  </dd>
                </div>
              ) : null}
            </Reveal>
          </div>
        </div>
      </header>

      {/* Without real media the poster would only repeat the metrics shown below. */}
      {project.image || project.video ? (
        <Reveal className="mt-16 px-2 sm:px-3 lg:mt-24">
          <CaseMedia project={project} eager className="aspect-[16/10]" />
        </Reveal>
      ) : null}

      {project.metrics.length > 0 ? (
        <section aria-label={t.casePage.metrics} className="px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
          <dl className="mx-auto grid max-w-[90rem] gap-y-10 sm:grid-cols-3">
            {project.metrics.map((metric, index) => (
              <Reveal key={metric.label} delay={index * 90} className="flex flex-col-reverse border-l border-border pl-5">
                <dt className="mt-3 max-w-[22ch] text-muted-foreground">{metric.label}</dt>
                <dd className="font-display text-[clamp(2.25rem,11vw,3rem)] font-medium tracking-tight tabular-nums lg:text-[clamp(3rem,5vw,4.5rem)]">
                  <Counter value={metric.value} />
                </dd>
              </Reveal>
            ))}
          </dl>
        </section>
      ) : null}

      <div className="px-4 pb-24 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[90rem] space-y-20 lg:space-y-28">
          {STORY.filter((key) => project[key]).map((key) => (
            <section key={key} aria-labelledby={`case-${key}`} className="grid gap-6 border-t border-border pt-8 lg:grid-cols-12">
              <h2 id={`case-${key}`} className="label self-start text-muted-foreground lg:sticky lg:top-28 lg:col-span-3">
                <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary align-middle" aria-hidden="true" />
                {t.casePage[key]}
              </h2>
              <Reveal className="space-y-6 lg:col-span-7 lg:col-start-5">
                {paragraphs(project[key]).map((paragraph) => (
                  <p key={paragraph} className="text-lg leading-relaxed text-pretty lg:text-xl">
                    {paragraph}
                  </p>
                ))}
              </Reveal>
            </section>
          ))}

          {project.stack.length > 0 ? (
            <section aria-labelledby="case-stack" className="grid gap-6 border-t border-border pt-8 lg:grid-cols-12">
              <h2 id="case-stack" className="label text-muted-foreground lg:col-span-3">
                {t.casePage.stack}
              </h2>
              <ul className="flex flex-wrap gap-2 lg:col-span-7 lg:col-start-5">
                {project.stack.map((item) => (
                  <li key={item} className="rounded-full border border-foreground/25 px-4 py-2 text-sm">
                    {item}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>
      </div>

      {project.gallery.length > 0 ? (
        <section aria-label={t.casePage.gallery} className="grid gap-3 px-2 pb-24 sm:px-3 md:grid-cols-2">
          {project.gallery.map((item, index) => (
            <Reveal as="figure" key={item.image} className={index % 3 === 0 ? 'md:col-span-2' : undefined}>
              <img
                src={item.image}
                alt={item.caption}
                loading="lazy"
                decoding="async"
                className="w-full rounded-2xl bg-muted object-cover"
              />
              {item.caption ? <figcaption className="label mt-3 text-muted-foreground">{item.caption}</figcaption> : null}
            </Reveal>
          ))}
        </section>
      ) : null}

      <section aria-label={t.casePage.whatNext} className="bg-inverse px-4 py-20 text-inverse-foreground sm:px-6 lg:px-10 lg:py-28">
        <div className="mx-auto grid max-w-[90rem] gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <p className="font-display text-3xl font-medium tracking-tight lg:text-5xl">{t.casePage.similar}</p>
            <p className="mt-4 max-w-sm opacity-70">{t.casePage.similarText}</p>
            <ButtonLink href="/#contact" size="lg" className="mt-8">
              {t.cta.discuss}
            </ButtonLink>
          </div>

          {next ? (
            <Link
              href={caseUrl(next.slug)}
              data-cursor={t.casePage.next}
              className="group block border-t border-current/20 pt-6 lg:col-span-6 lg:col-start-7"
            >
              <p className="label opacity-60">{t.casePage.next}</p>
              <p className="mt-4 font-display text-4xl font-medium tracking-tight transition-transform duration-500 ease-out-expo group-hover:translate-x-2 lg:text-6xl">
                {next.title} →
              </p>
              {next.description ? <p className="mt-4 max-w-md opacity-70">{next.description}</p> : null}
            </Link>
          ) : null}
        </div>
      </section>
    </article>
  )
}
