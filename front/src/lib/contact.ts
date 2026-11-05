import { useEffect } from 'react'

import { scrollToHash } from '@/lib/router'

const PREFILL_EVENT = 'contact:prefill'

/** Scroll to the contact form with a project type already picked (e.g. from a price card). */
export function requestContact(projectType: string): void {
  window.dispatchEvent(new CustomEvent<string>(PREFILL_EVENT, { detail: projectType }))
  scrollToHash('#contact')
}

/** The contact form's side of requestContact(). */
export function useContactPrefill(onPrefill: (projectType: string) => void): void {
  useEffect(() => {
    const handler = (event: Event) => onPrefill((event as CustomEvent<string>).detail)
    window.addEventListener(PREFILL_EVENT, handler)
    return () => window.removeEventListener(PREFILL_EVENT, handler)
  }, [onPrefill])
}
