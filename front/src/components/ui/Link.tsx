import type { AnchorHTMLAttributes } from 'react'

import { localizeHref, useLang } from '@/lib/i18n'
import { handleLinkClick } from '@/lib/router'

/**
 * An `<a>` for same-site routes that navigates without a page reload. Internal
 * paths are written once (`/blog/`, `/#contact`) and get `/en` on the English site.
 */
export function Link({ onClick, href, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const lang = useLang()

  return (
    <a
      {...props}
      href={href === undefined ? undefined : localizeHref(href, lang)}
      onClick={(event) => {
        onClick?.(event)
        if (!event.defaultPrevented) handleLinkClick(event)
      }}
    />
  )
}
