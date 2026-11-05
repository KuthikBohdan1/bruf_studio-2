import { ArrowUpRight } from 'lucide-react'

import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import type { Project, SiteType } from '@/lib/api'
import { useT } from '@/lib/i18n'
import { pad } from '@/lib/text'

interface SiteTypesProps {
  types: SiteType[]
  /** Looked up by slug for the examples: their titles and live links. */
  projects: Project[]
}

/** What sites the studio builds and who each kind is for. */
export function SiteTypes({ types, projects }: SiteTypesProps) {
  const t = useT()

  return (
    <Section id="site-types" label={t.nav.siteTypes} title={t.siteTypes.title}>
      <ol className="border-b border-border">
        {types.map((type, index) => {
          const examples = projects.filter((project) => project.url && type.examples.includes(project.slug))

          return (
            <Reveal as="li" key={type.id} className="grid gap-6 border-t border-border py-10 lg:grid-cols-12 lg:gap-8 lg:py-14">
              <div className="lg:col-span-5">
                <h3 className="flex items-baseline gap-4 font-display text-2xl font-medium tracking-tight text-balance lg:text-3xl">
                  <span className="label text-muted-foreground">{pad(index + 1)}</span>
                  {type.title}
                </h3>
                {type.description ? (
                  <p className="mt-4 max-w-md leading-relaxed text-pretty text-muted-foreground">{type.description}</p>
                ) : null}
              </div>

              <div className="space-y-8 lg:col-span-7">
                <ul className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
                  {type.audience.map((item) => (
                    <li key={item} className="flex gap-3 text-lg">
                      <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {item}
                    </li>
                  ))}
                </ul>

                {type.formats.length > 0 ? (
                  <div>
                    {type.formats_title ? <p className="label text-muted-foreground">{type.formats_title}</p> : null}
                    <ul className="mt-3 space-y-2">
                      {type.formats.map((format) => (
                        <li key={format} className="text-pretty">
                          {format}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {examples.length > 0 ? (
                  <div>
                    <p className="label text-muted-foreground">{t.siteTypes.examples}</p>
                    <ul className="mt-2 flex flex-col items-start gap-1">
                      {examples.map((project) => (
                        <li key={project.slug}>
                          <a
                            href={project.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 py-1 underline underline-offset-4 hover:decoration-primary"
                          >
                            {project.title}
                            <ArrowUpRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </div>
            </Reveal>
          )
        })}
      </ol>
    </Section>
  )
}
