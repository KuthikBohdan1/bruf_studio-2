import { Marquee } from '@/components/ui/Marquee'
import type { Service } from '@/lib/api'

/** A lime band of service names between the hero and the content. */
export function ServicesTicker({ services }: { services: Service[] }) {
  return (
    <div className="border-y border-border bg-primary py-5 text-primary-foreground lg:py-7">
      <Marquee
        items={services.map((service) => service.title)}
        duration={Math.max(24, services.length * 7)}
        className="font-display text-3xl font-medium tracking-tight lg:text-5xl"
      />
    </div>
  )
}
