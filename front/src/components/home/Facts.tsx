import { Counter } from '@/components/ui/Counter'
import { Reveal } from '@/components/ui/Reveal'
import type { Fact } from '@/lib/api'
import { useT } from '@/lib/i18n'

export function Facts({ facts }: { facts: Fact[] }) {
  const t = useT()

  return (
    <section aria-label={t.facts.label} className="px-4 py-20 sm:px-6 lg:px-10 lg:py-28">
      <dl className="mx-auto grid max-w-[90rem] grid-cols-2 gap-y-12 lg:grid-cols-3">
        {facts.map((fact, index) => (
          <Reveal key={fact.id} delay={index * 90} className="flex flex-col-reverse border-l border-border pr-4 pl-5">
            <dt className="mt-3 max-w-[16ch] text-sm text-muted-foreground">{fact.label}</dt>
            <dd className="font-display text-4xl font-medium tracking-tight tabular-nums sm:text-5xl lg:text-6xl">
              <Counter value={fact.value} />
            </dd>
          </Reveal>
        ))}
      </dl>
    </section>
  )
}
