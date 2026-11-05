import { parseBody } from '@/lib/markup'

/** An article body rendered from the admin's plain-text format (lib/markup.ts). */
export function PostBody({ body }: { body: string }) {
  return (
    <div className="max-w-[68ch] text-lg leading-relaxed text-pretty">
      {parseBody(body).map((block, index) => {
        switch (block.type) {
          case 'h2':
            return (
              <h2 key={index} className="mt-14 mb-5 font-display text-2xl font-medium tracking-tight lg:text-3xl">
                {block.text}
              </h2>
            )
          case 'h3':
            return (
              <h3 key={index} className="mt-10 mb-4 text-xl font-semibold">
                {block.text}
              </h3>
            )
          case 'ul':
            return (
              <ul key={index} className="my-6 space-y-3">
                {block.items.map((item) => (
                  <li key={item} className="flex gap-3">
                    <span aria-hidden="true" className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            )
          default:
            return (
              <p key={index} className="my-5 text-foreground/85">
                {block.text}
              </p>
            )
        }
      })}
    </div>
  )
}
