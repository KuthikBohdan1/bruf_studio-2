import { Button, ButtonLink } from '@/components/ui/Button'
import { HYPERSPACE_MS, jumpToHyperspace } from '@/lib/easterEggs'
import { localizeHref, useLang } from '@/lib/i18n'
import { navigate } from '@/lib/router'
import { useT } from '@/lib/i18n'

export function NotFoundPage() {
  const t = useT()
  const lang = useLang()

  // Easter egg: leave the dead end at light speed, landing on the home page.
  function jump() {
    jumpToHyperspace()
    window.setTimeout(() => navigate(localizeHref('/', lang)), HYPERSPACE_MS * 0.6)
  }

  return (
    <section className="flex min-h-svh flex-col items-start justify-center px-4 sm:px-6 lg:px-10">
      <div className="mx-auto w-full max-w-[90rem]">
        <p className="label text-muted-foreground">{t.notFound.label}</p>
        <h1 className="mt-6 max-w-[14ch] font-display text-5xl font-medium tracking-tight lg:text-8xl">
          {t.notFound.before}
          <span className="marker">{t.notFound.marked}</span>
        </h1>
        <p className="mt-6 max-w-md text-lg text-muted-foreground">
          {t.notFound.text}
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <ButtonLink href="/#projects" size="lg">
            {t.notFound.back}
          </ButtonLink>
          <Button variant="outline" size="lg" onClick={jump}>
            {t.notFound.jump}
          </Button>
        </div>
      </div>
    </section>
  )
}
