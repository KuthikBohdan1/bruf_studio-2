/** Types mirror `django/main/serializers.py`. */

import { STRINGS, type Lang } from '@/lib/i18n'

export interface SiteSettings {
  name: string
  tagline: string
  /** Home <title> override; empty means "name — tagline". */
  seo_title: string
  description: string
  availability: string
  hero_video: string | null
  hero_poster: string | null
  email: string
  phone: string
  address: string
  logo: string | null
}

export interface ServiceQuestion {
  id: number
  question: string
  answer: string
}

export interface Service {
  id: number
  slug: string
  title: string
  /** H1 of the service's page; empty means `title`. */
  headline: string
  /** The page's <title>; empty means "headline | site name". */
  seo_title: string
  /** First paragraph of the page; empty means `description`. */
  intro: string
  /** Page text in the blog's plain-text format (lib/markup.ts). */
  details: string
  description: string
  deliverables: string[]
  price_from: string
  duration: string
  questions: ServiceQuestion[]
}

export interface ProjectMetric {
  value: string
  label: string
}

export interface ProjectImage {
  image: string
  caption: string
}

export interface Project {
  id: number
  slug: string
  title: string
  /** The service this case is shown under. */
  service: number | null
  client: string
  category: string
  year: number | null
  description: string
  challenge: string
  solution: string
  result: string
  stack: string[]
  metrics: ProjectMetric[]
  gallery: ProjectImage[]
  image: string | null
  video: string | null
  /** `#RRGGBB` or empty. */
  color: string
  url: string
}

export interface SiteType {
  id: number
  title: string
  description: string
  audience: string[]
  formats_title: string
  formats: string[]
  /** Slugs of the projects shown as examples. */
  examples: string[]
}

export interface ProcessStep {
  id: number
  title: string
  description: string
  duration: string
}

export interface Fact {
  id: number
  value: string
  label: string
}

export interface FaqItem {
  id: number
  question: string
  answer: string
}

export interface Post {
  id: number
  slug: string
  title: string
  excerpt: string
  /** Plain text: blank lines between paragraphs, "## " headings, "- " list items. */
  body: string
  category: PostCategory
  /** Uploaded cover; without one the blog draws a geometric placeholder. */
  cover: string | null
  /** Shown large at the top of the blog; the newest post when none is marked. */
  is_featured: boolean
  author: string
  author_role: string
  /** ISO 8601. */
  published_at: string
  updated_at: string
}

/** Mirrors `Post.Category`, in the order of the blog's filter; labels live in lib/i18n.ts. */
export const POST_CATEGORIES = ['guides', 'seo', 'comparison', 'cases', 'speed', 'studio'] as const

export type PostCategory = (typeof POST_CATEGORIES)[number]

export interface SocialLink {
  id: number
  name: string
  url: string
}

export interface SiteData {
  settings: SiteSettings | null
  services: Service[]
  projects: Project[]
  site_types: SiteType[]
  process: ProcessStep[]
  facts: Fact[]
  faq: FaqItem[]
  posts: Post[]
  socials: SocialLink[]
}

/** Mirrors `Message.Budget` in django/main/models.py; labels live in lib/i18n.ts. */
export const BUDGETS = ['lt10', '10-20', '20-30', 'gt30', 'unknown'] as const

export type Budget = (typeof BUDGETS)[number] | ''

/** Mirrors `Message.ContactMethod`; Telegram first, as the fastest channel. */
export const CONTACT_METHODS = ['telegram', 'phone', 'email'] as const

export type ContactMethod = (typeof CONTACT_METHODS)[number]

export interface MessagePayload {
  name: string
  /** A service title or "other" in the page's language (`Message.OTHER_PROJECT_TYPES`); empty when not chosen. */
  project_type: string
  contact_method: ContactMethod
  email: string
  /** Phone number or Telegram handle, depending on `contact_method`. */
  phone: string
  budget: Budget
  message: string
  /** Honeypot: stays empty for people (`HONEYPOT_FIELD` in main/views.py). */
  hp_field?: string
}

/** Empty in production: the API is served from the same origin as the SPA. */
const BASE_URL = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

/** Field-level errors returned by DRF, e.g. `{ email: ["Enter a valid..."] }`. */
export class ApiError extends Error {
  readonly fields: Record<string, string>

  constructor(message: string, fields: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.fields = fields
  }
}

async function toApiError(response: Response, lang: Lang): Promise<ApiError> {
  const copy = STRINGS[lang].api
  if (response.status === 429) {
    return new ApiError(copy.throttled)
  }

  try {
    const body = await response.json()
    const fields: Record<string, string> = {}

    for (const [key, value] of Object.entries(body as Record<string, unknown>)) {
      fields[key] = Array.isArray(value) ? String(value[0]) : String(value)
    }

    return new ApiError(fields.detail ?? copy.checkFields, fields)
  } catch {
    return new ApiError(copy.failed(response.status))
  }
}

/** `GET /api/site/?lang=…` — the entire site payload, in one language, in one round trip. */
export async function fetchSiteData(lang: Lang, signal?: AbortSignal): Promise<SiteData> {
  const response = await fetch(`${BASE_URL}/api/site/?lang=${lang}`, {
    signal,
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw await toApiError(response, lang)
  }

  return response.json() as Promise<SiteData>
}

async function post(path: string, payload: unknown, lang: Lang): Promise<void> {
  // `lang` picks the language of the validation messages.
  const response = await fetch(`${BASE_URL}${path}?lang=${lang}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw await toApiError(response, lang)
  }
}

/** `POST /api/message/` — contact form submission. */
export function sendMessage(payload: MessagePayload, lang: Lang): Promise<void> {
  return post('/api/message/', payload, lang)
}

/** `POST /api/subscribe/` — blog newsletter sign-up. */
export function subscribe(email: string, lang: Lang): Promise<void> {
  return post('/api/subscribe/', { email }, lang)
}
