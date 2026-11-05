# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

Web-studio site. Django 5.2 + DRF (`django/`) owns all content and is edited in the Django admin; a Vite + React 18 + Tailwind v4 SPA (`front/`) renders it. Both are served from one origin. `README.md` covers running, deploying and the step-by-step recipe for adding a new content section.

User-facing strings (UI copy, admin verbose names, API validation messages) are Ukrainian; code comments are English. `LANGUAGE_CODE` defaults to `uk-ua`.

## Commands

```bash
# Backend (venv at django/.venv; SQLite is used when POSTGRES_DB/POSTGRES_USER are unset)
cd django
DEBUG=True .venv/bin/python manage.py runserver
.venv/bin/python manage.py seed_demo                         # demo content + admin user, idempotent
.venv/bin/ruff check . && .venv/bin/ruff format --check .    # lint (ruff from requirements-dev.txt)

# Frontend
cd front
npm run dev          # Vite on :5173, proxies /api and /media to DEV_API_TARGET (default :8008)
npm run build        # tsc --noEmit, then build into ../django/frontend_dist
npm run typecheck
npm run lint         # ESLint, zero warnings allowed

# Full stack
docker compose up -d --build                                 # http://127.0.0.1:8008
```

Lint: Ruff (`django/ruff.toml`, migrations excluded) and ESLint (`front/eslint.config.js`). CI runs both, applies migrations on Postgres, runs the SPA build and a Docker build on every push/PR (`.github/workflows/ci.yml`).

**Branches & deploy.** Work on `dev`, fast-forward `main` → `stable` → `prod`. A green CI run on `prod` deploys: Actions SSHes to the VPS with a key pinned (via `command=` in `authorized_keys`) to `scripts/deploy.sh`, which fetches `origin/prod`, rebuilds with compose and waits for the healthcheck. `deploy.sh` keeps its body in `main()` because the `git reset` inside rewrites the file while it runs.

## Architecture

**One payload.** `GET /api/site/` (`main/views.py`) returns `{settings, services, projects, site_types, process, facts, faq, posts, socials}` in a single response (projects carry nested `metrics` and `gallery`); the SPA fetches it once on mount (`hooks/useSiteData.ts`). It is cached under `SITE_CACHE_KEY` in a file-based cache (shared across gunicorn workers — LocMem would desync them) and cleared by `main/signals.py` whenever a model in `CONTENT_MODELS` (including inline models such as `ProjectMetric`) is saved or deleted. A new content model must be added to `CONTENT_MODELS`, to `SiteSerializer`, to `build_site_payload()`, and to `SiteData` in `front/src/lib/api.ts`.

The payload is serialized **without a request in context** on purpose, so file fields stay relative (`/media/...`) — otherwise whichever request missed the cache would bake its Host into every image URL.

`SiteSettings` is a singleton by convention: the API and SEO read `.order_by("id").last()`, and the admin blocks adding a second row. If it is missing, the SPA shows `EmptyScreen`.

`POST /api/message/` stores a `Message` (contact-form lead), throttled by the `message` scope (`MESSAGE_THROTTLE_RATE`). With `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` set, `main/notify.py` also sends each lead to Telegram on a background thread (failures are only logged). The bot only sends; it does not talk to visitors, who write to the studio's own Telegram. A filled `hp_field` honeypot gets the normal answer and is dropped. Only the contact for the chosen `contact_method` is required (Telegram/phone → `phone`, email or no method → `email`); `project_type` must be a `Service` title or `Message.OTHER_PROJECT_TYPE`.

**English version.** Ukrainian is the source language at the root; English lives under `/en/` with the same paths. Every translatable field has an optional `<name>_en` twin, added in bulk from `TRANSLATED_FIELDS` at the bottom of `main/models.py` (add a field there, then `makemigrations`). `GET /api/site/?lang=en` swaps in the twins (`TranslatedSerializer`), falling back to Ukrainian when a twin is empty; posts are the exception — the English blog lists only posts with `title_en` and `body_en` (`has_english`). The payload is cached per language (`site_cache_key`). `?lang=en` on the two POST endpoints localizes validation messages; the contact form accepts English service titles and «Other». `seo.py` builds every page for a `lang` (`/en/...` URL patterns pass `{"lang": "en"}`), emits hreflang links and a bilingual sitemap. In the SPA, `lib/i18n.ts` holds all interface copy (`useT()`), `useLang()` reads the prefix, `<Link>` adds `/en` to internal paths by itself, and `LanguageSwitch` links to the same page in the other language. New UI strings go into both dictionaries in `lib/i18n.ts`, never inline.

**Routes.** `/`, `/services/<slug>/` (one page per `Service`, written for one search query: `headline`, `seo_title`, `seo_description`, `intro`, `details`, its `ServiceQuestion`s and the `Project`s pointing at it; `pages/ServicePage.tsx`, `seo.service_page`), `/cases/<slug>/` (one page per `Project`), `/blog/` and `/blog/<slug>/` (published `Post`s; `Post.published` is the manager for public queries) and `/privacy/` all serve the same SPA shell; any unknown URL gets it with a 404 status and `noindex` (`handler404` → `seo.page_not_found`; `/api/`, `/admin/`, `/media/` and `/static/` keep a bare 404). The blog page (`pages/BlogPage.tsx`) shows the `is_featured` post (else the newest) above a 6-per-page grid, with client-side category pills (`Post.Category`, mirrored as `POST_CATEGORIES` in `lib/api.ts`) and search; posts without an uploaded cover get a geometric placeholder from `lib/covers.ts`, picked by post id. `POST /api/subscribe/` stores a `Subscriber` from the blog's newsletter form (throttle scope `subscribe`; repeat sign-ups are not errors) — nothing sends emails yet. Blog bodies are plain text rendered by `lib/markup.ts` (blank line = paragraph, `## ` heading, `- ` list) — never HTML. The SPA routes with the tiny History API router in `lib/router.ts` (`usePathname`, `navigate`, `<Link>` in `components/ui/Link.tsx`); it saves `scrollY` in `history.state` so Back restores the position, and `history.scrollRestoration` is `manual`. Internal links are `/#section` so they work from case pages too.

**SEO.** `main/seo.py` renders the built `frontend_dist/index.html` as a Django template, injecting `seo.*` (title, description, OG tags, `lang`, `locale`, JSON-LD `@graph`: `Organization` + `FAQPage` on home, `CreativeWork` on case pages). Each page is a `Page` built in `seo.py` (`home_page`, `case_page`, `blog_page`, `post_page`); every page also carries `WebSite` and `Organization` nodes, with `logo-512.png`/`og-default.png` from `front/public/` as fallbacks. A page's `content` also renders as plain HTML into `#root` (`templates/seo/content.html`) for readers without JavaScript: hidden by `.seo-fallback`, shown by a `<noscript>` style, replaced when the app starts. `SiteSettings.seo_title`/`seo_description` drive the home `<title>` and meta description, separately from the hero copy; home JSON-LD also lists services with starting prices. `sitemap.xml` lists every case and post. `robots.txt` must keep `/api/site/` crawlable — Google renders the SPA and needs that data. Consequences:
- `front/index.html` is a Django template — never put `{{ }}`/`{% %}` inside HTML comments there (500 on every page).
- In `npm run dev`, the `djangoTemplatePlaceholders` plugin in `vite.config.ts` substitutes `seo.*` keys; a new `seo.*` key needs a dev value there too.
- `/media/` goes through `main/media.py` (adds a 30-day `Cache-Control` and `206` Range responses on top of `django.views.static.serve`; Safari will not play video without them, and on the shared host nothing in front serves `/media`).
- `/` returns 501 with build instructions when the frontend has not been built.

**Frontend.** `pages/` (`HomePage`, `CasePage`, `NotFoundPage`), `components/home/` (home sections), `components/cases/`, `components/layout/` (navbar, mobile menu, footer, cursor bubble, social cards), `components/ui/` (primitives: `Button`/`ButtonLink`, `Section`, `Link`, `Reveal`, `SplitText`, `Marquee`, `Counter`). Cases come first after the facts, each at full width with its screen recording (`Project.video`, 1280×800, a slow scroll down and back) playing while on screen. Services and prices share one section, `Pricing` (`#pricing`, menu «Послуги й ціни»): a card per service with duration, price, description and deliverables; Telegram is the primary call to action there (card buttons and a lime banner); the secondary «або залишити заявку» calls `requestContact()` (`lib/contact.ts`), which pre-selects the project type in the contact form. Below the prices the section links the featured blog post (else the newest); the home page has no blog section of its own. `SiteTypes` (`#site-types`, from the `SiteType` model) follows it: what kinds of sites the studio builds, for whom, with live links to example cases. `TelegramButton` (layout) floats bottom-right on every page after the first screen and hides while `#pricing-telegram`, `#contact` or `#site-footer` is on screen. `homeNavItems()` in `App.tsx` lists only sections with content and must follow the section order in `HomePage`. The hero is centred (status line, tagline with the last word on the marker, service titles, CTAs). `SiteSettings.hero_video` plays inside its backdrop (`HeroBackdrop`): a round lens, veiled and lightly blurred (`.hero-orb`/`.hero-lens` in `styles.css`, tuned per theme by `--lens-veil`, `--lens-brightness`), framed by `DotField` (layout, mounted once in `App`): a fixed canvas of seeded dots behind all content that answers the scroll with depth parallax, spring lag and speed streaks and wraps vertically (`--dust-opacity`); the lens sinks a little as the hero scrolls away (`useScrollProgress('leave')`); the video starts loading 800 ms after mount, is paused off screen, and only the poster shows with reduced motion, data saver or a 2g/3g connection; the demo reel in `fixtures/demo_media/site/` (`hero-wall-720.mp4`, 12 s seamless loop) is a tilted wall of portfolio screenshots and brand cards with a wandering `bruf` cursor, rendered frame by frame from an HTML scene. The hero has id `top` and is observed by `useActiveSection` so no nav item is highlighted there. `@` → `src/`.

Design: fonts are self-hosted via `@fontsource-variable` (Unbounded display, Onest text, JetBrains Mono for `.label`). Colour tokens are CSS variables in `src/styles.css`; the lime `primary` is always a fill with `primary-foreground` text, never body text. Theme is a `dark` class on `<html>`. It is automatic (`lib/theme.ts`): dark 20:00–08:00 in the visitor's local time, otherwise the OS scheme; `startAutoTheme()` re-checks every minute and on OS changes. The toggle (`hooks/useTheme.ts`) stores an override in `localStorage['theme-override']` that expires at the next 08:00/20:00. The inline script in `index.html` repeats these rules before first paint — keep both in sync. Telegram/Instagram are found among `socials` by URL (`findProfile` in `lib/text.ts`) and get dedicated cards and CTAs.

Motion: `Reveal`/`SplitText` use `useInView` (plays once; anything on screen at mount plays immediately); scroll-driven effects (`useScrollProgress`) write a `--progress` CSS variable in rAF instead of re-rendering. Everything honours `prefers-reduced-motion`. Tailwind's `hidden` loses to a component's own `inline-flex` — hide a wrapper instead of passing `hidden` to `ButtonLink`.

**Easter eggs.** `lib/easterEggs.ts` holds original space-opera nods (no third-party names, logos or quotes): the cheat code ↑↑↓↓←→←→BA, five taps on the footer wordmark or the 404 button make `DotField` jump to hyperspace; three quick switches to dark in `ThemeToggle` show a dark-side toast; the console prints a greeting. All of it is skipped with reduced motion.

**Settings** (`config/settings.py`) read everything from the repo-root `.env` (see `.env.example`). Postgres is used when `POSTGRES_DB` and `POSTGRES_USER` are set. `seed_demo` generates and prints a random admin password when `DJANGO_SUPERUSER_PASSWORD` is unset or empty; it also copies `main/fixtures/demo_media/` (case covers referenced by the fixture) into media storage without overwriting existing files.

**Docker.** `Dockerfile` builds the SPA in Node, then copies it to `/srv/frontend_dist` in the Python image and runs `collectstatic --ignore index.html`. `docker/entrypoint.sh` runs `migrate` and `seed_demo` before gunicorn. `compose.prod.yaml` adds Caddy (TLS) in front; only Caddy binds public ports, and it serves `/media` directly (Range requests for Safari video). On a shared host whose proxy already owns 80/443, use `compose.edge.yaml` instead: `web` joins the external `edge` network as `bruf-web`.
