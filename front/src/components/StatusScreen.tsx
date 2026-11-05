import { AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/Button'
import { useT } from '@/lib/i18n'

/** Skeleton shown while `/api/site/` is in flight. Mirrors the hero layout so
 *  the real content does not shift anything when it arrives. */
export function LoadingScreen() {
  const t = useT()

  return (
    <div
      role="status"
      aria-label={t.status.loading}
      className="mx-auto flex min-h-svh max-w-[90rem] animate-pulse flex-col gap-6 px-4 pt-28 pb-10 sm:px-6 lg:px-10 lg:pt-36"
    >
      <div className="h-4 w-64 rounded-full bg-muted" />
      <div className="mt-10 h-[clamp(2.75rem,8.6vw,9.5rem)] w-4/5 rounded-xl bg-muted lg:mt-14" />
      <div className="h-[clamp(2.75rem,8.6vw,9.5rem)] w-3/5 rounded-xl bg-muted" />
      <div className="mt-auto flex justify-between gap-6">
        <div className="h-16 w-full max-w-md rounded-xl bg-muted" />
        <div className="h-14 w-72 rounded-full bg-muted" />
      </div>
    </div>
  )
}

export function ErrorScreen({ message }: { message: string }) {
  const t = useT()

  return (
    <div
      role="alert"
      className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
    >
      <AlertCircle className="h-12 w-12 text-danger" aria-hidden="true" />
      <h1 className="text-xl font-semibold">{t.status.errorTitle}</h1>
      <p className="text-sm text-muted-foreground">{message}</p>
      <Button onClick={() => window.location.reload()}>{t.status.retry}</Button>
    </div>
  )
}

export function EmptyScreen() {
  const t = useT()

  return (
    <div className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">{t.status.emptyTitle}</h1>
      <p className="text-sm text-muted-foreground">
        {t.status.emptyText}{' '}
        <code className="rounded bg-muted px-1.5 py-0.5">python manage.py seed_demo</code>.
      </p>
      <a href="/admin/" className="underline underline-offset-4">
        {t.status.admin}
      </a>
    </div>
  )
}
