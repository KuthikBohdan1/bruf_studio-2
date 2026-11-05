import { CaseMedia } from '@/components/cases/CaseMedia'
import { Link } from '@/components/ui/Link'
import { Reveal } from '@/components/ui/Reveal'
import { Section } from '@/components/ui/Section'
import type { Project } from '@/lib/api'
import { caseUrl } from '@/lib/router'
import { pad } from '@/lib/text'
import { useT } from '@/lib/i18n'

export function Cases({ projects }: { projects: Project[] }) {
  const t = useT()

  return (
    <Section
      id="projects"
      label={t.nav.projects}
      title={t.cases.title}
      aside={<p className="label text-muted-foreground">{t.cases.count(pad(projects.length))}</p>}
    >
      {/* Each case gets the full width: the work is what sells the studio. */}
      <ul className="space-y-20 lg:space-y-32">
        {projects.map((project) => (
          <li key={project.id}>
            <Reveal>
              <CaseCard project={project} />
            </Reveal>
          </li>
        ))}
      </ul>
    </Section>
  )
}

export function CaseCard({ project }: { project: Project }) {
  const t = useT()
  // Image covers do not show the metric, so surface it under the card instead.
  const headline = project.image || project.video ? project.metrics[0] : undefined

  return (
    <Link
      href={caseUrl(project.slug)}
      data-cursor={t.cases.open}
      className="group block"
    >
      <CaseMedia project={project} className="aspect-[16/10]" />

      <div className="mt-6 grid gap-x-6 gap-y-2 lg:grid-cols-[minmax(0,1fr)_auto]">
        <h3 className="font-display text-3xl font-medium tracking-tight text-balance lg:text-5xl">{project.title}</h3>
        <p className="label text-muted-foreground lg:text-right">
          {[project.category, project.year].filter(Boolean).join(' · ')}
        </p>
        {project.description ? (
          <p className="max-w-xl text-pretty text-muted-foreground">{project.description}</p>
        ) : null}
        {headline ? (
          <p className="lg:text-right">
            <span className="marker font-display text-xl font-medium">{headline.value}</span>
            <span className="ml-2 text-sm text-muted-foreground">{headline.label}</span>
          </p>
        ) : null}
      </div>
    </Link>
  )
}
