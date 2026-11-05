"""Server-rendered SEO for the single-page app.

The SPA shell is a static bundle, so crawlers would otherwise see an empty
`<div id="root">`. These views render the built `index.html` through the Django
template engine and inject title/description/Open Graph/JSON-LD built from the
database, plus the usual robots.txt and sitemap.xml.
"""

import json
import re
from collections.abc import Callable
from dataclasses import dataclass, field
from datetime import datetime
from functools import partial
from urllib.parse import urlparse

from django.conf import settings
from django.http import HttpResponse, HttpResponseNotFound
from django.shortcuts import render
from django.template import TemplateDoesNotExist
from django.template.loader import render_to_string
from django.templatetags.static import static
from django.utils.html import escape, strip_tags
from django.views.decorators.http import require_safe

from main.models import (
    DEFAULT_LANGUAGE,
    FaqItem,
    Post,
    ProcessStep,
    Project,
    Service,
    SiteSettings,
    SiteType,
    SocialLink,
    has_english,
    translated,
)

BLOG_PATH = "/blog/"
PRIVACY_PATH = "/privacy/"

# The English site lives under /en/ with the same paths after the prefix.
LANGUAGE_PREFIX = {"uk": "", "en": "/en"}
OG_LOCALE = {"uk": "uk_UA", "en": "en_US"}

COPY = {
    "uk": {
        "home": "Головна",
        "blog": "Блог",
        "case": "кейс",
        "cases": "Кейси",
        "services": "Послуги й ціни",
        "site_types": "Які сайти ми створюємо",
        "included": "Що входить",
        "process": "Як ми працюємо",
        "faq": "Часті питання",
        "contact": "Контакти",
        "other_language": "English version",
        "privacy": "Політика конфіденційності",
        "privacy_description": "Які дані збирає сайт bruf.pro, навіщо вони потрібні й як їх видалити.",
        "not_found": "Сторінку не знайдено",
        "blog_title": "Блог {site} — про сайти, ціни й розробку",
        # Same text as the blog intro in front/src/lib/i18n.ts.
        "blog_description": (
            "Пишемо про сайти для бізнесу: скільки коштують, як працюють, як приводять клієнтів із Google."
        ),
    },
    "en": {
        "home": "Home",
        "blog": "Blog",
        "case": "case study",
        "cases": "Work",
        "services": "Services and prices",
        "site_types": "What sites we build",
        "included": "What is included",
        "process": "How we work",
        "faq": "FAQ",
        "contact": "Contact",
        "other_language": "Українська версія",
        "privacy": "Privacy policy",
        "privacy_description": "What data bruf.pro collects, why it is needed and how to have it deleted.",
        "not_found": "Page not found",
        "blog_title": "{site} blog — websites, prices and development",
        "blog_description": (
            "On websites for business: what they cost, how they work and how they bring clients from Google."
        ),
    },
}

# Brand files shipped with the SPA (front/public/), used when the admin has not
# uploaded a logo or a social preview image.
DEFAULT_LOGO = "logo-512.png"
DEFAULT_OG_IMAGE = "og-default.png"

MISSING_BUILD_MESSAGE = """<!doctype html>
<html lang="uk"><head><meta charset="utf-8"><title>Frontend build missing</title></head>
<body style="font-family:system-ui;max-width:40rem;margin:4rem auto;line-height:1.6">
<h1>Frontend build missing</h1>
<p>Django could not find <code>django/frontend_dist/index.html</code>.</p>
<p>Build the SPA first:</p>
<pre>cd front &amp;&amp; npm install &amp;&amp; npm run build</pre>
<p>Or run the whole stack with <code>docker compose up --build</code>.</p>
</body></html>"""


def absolute(path: str) -> str:
    return f"{settings.SITE_URL}{path}"


def localized(path: str, lang: str) -> str:
    """`/blog/` → `/en/blog/` on the English site."""
    return f"{LANGUAGE_PREFIX[lang]}{path}"


def site_domain() -> str:
    return urlparse(settings.SITE_URL).hostname or ""


def compact(data: dict) -> dict:
    """Drop empty values so the JSON-LD only states what we actually know."""
    return {key: value for key, value in data.items() if value not in (None, "", [])}


def file_url(field) -> str:
    return absolute(field.url) if field else ""


@dataclass
class Page:
    """What one URL tells search engines and link previews."""

    title: str
    description: str
    path: str
    lang: str = DEFAULT_LANGUAGE
    image: str = ""
    # Languages this page exists in; the hreflang links and the language switch use them.
    languages: tuple[str, ...] = ("uk", "en")
    og_type: str = "website"
    # Page-specific schema.org nodes, added after the site-wide ones.
    nodes: list[dict] = field(default_factory=list)
    # The page's content as plain HTML (see `page_content`).
    content: dict = field(default_factory=dict)
    # An image worth fetching before the app starts (the hero's poster).
    preload_image: str = ""
    noindex: bool = False


# --- schema.org ------------------------------------------------------------------


def website_jsonld(site: SiteSettings | None, lang: str) -> dict:
    """Google takes the result's site name from this node (name + alternateName)."""
    return compact(
        {
            "@type": "WebSite",
            "@id": absolute("/#website"),
            "name": site.name if site else site_domain(),
            "alternateName": [site_domain()],
            "url": absolute("/"),
            "inLanguage": list(LANGUAGE_PREFIX),
            "publisher": {"@id": absolute("/#organization")} if site else None,
        }
    )


def postal_address(site: SiteSettings, lang: str) -> dict | None:
    """The city from a free-form address ("Львів, Україна · працюємо віддалено")."""
    city = re.split(r"[,·]", translated(site, "address", lang))[0].strip()
    return {"@type": "PostalAddress", "addressLocality": city, "addressCountry": "UA"} if city else None


def organization_jsonld(site: SiteSettings, lang: str) -> dict:
    return compact(
        {
            "@type": "Organization",
            "@id": absolute("/#organization"),
            "name": site.name,
            "alternateName": [site_domain()],
            "description": strip_tags(translated(site, "description", lang) or translated(site, "tagline", lang))[:300],
            "url": absolute("/"),
            "logo": file_url(site.logo) or absolute(static(DEFAULT_LOGO)),
            "email": site.email,
            "telephone": site.phone,
            "address": postal_address(site, lang),
            "areaServed": {"@type": "Country", "name": "Ukraine"},
            "sameAs": list(SocialLink.objects.values_list("url", flat=True)),
        }
    )


def service_offer(price: str) -> dict | None:
    """ "від 5 500 ₴" → a starting price in hryvnias; "індивідуально" has none."""
    digits = re.sub(r"\D", "", price)
    if not digits:
        return None
    return {
        "@type": "Offer",
        "priceSpecification": {"@type": "PriceSpecification", "minPrice": int(digits), "priceCurrency": "UAH"},
    }


def service_jsonld(service: Service, lang: str) -> dict:
    return compact(
        {
            "@type": "Service",
            "name": translated(service, "headline", lang) or translated(service, "title", lang),
            "description": strip_tags(translated(service, "description", lang)),
            "url": absolute(localized(service.get_absolute_url(), lang)),
            "provider": {"@id": absolute("/#organization")},
            "areaServed": {"@type": "Country", "name": "Ukraine"},
            "offers": service_offer(service.price_from),
        }
    )


def services_jsonld(lang: str) -> dict | None:
    items = [
        {
            "@type": "ListItem",
            "position": position,
            "item": service_jsonld(service, lang),
        }
        for position, service in enumerate(Service.objects.all(), 1)
    ]
    return {"@type": "ItemList", "itemListElement": items} if items else None


def breadcrumbs_jsonld(*crumbs: tuple[str, str]) -> dict:
    return {
        "@type": "BreadcrumbList",
        "itemListElement": [
            {"@type": "ListItem", "position": index, "name": name, "item": absolute(path)}
            for index, (name, path) in enumerate(crumbs, 1)
        ],
    }


def faq_jsonld(lang: str, questions=None) -> dict | None:
    items = [
        {
            "@type": "Question",
            "name": translated(item, "question", lang),
            "acceptedAnswer": {"@type": "Answer", "text": strip_tags(translated(item, "answer", lang))},
        }
        for item in (FaqItem.objects.all() if questions is None else questions)
    ]
    return {"@type": "FAQPage", "mainEntity": items} if items else None


# --- plain HTML for readers that do not run JavaScript ----------------------------
#
# Crawlers that skip JavaScript (and people without it) would otherwise get an
# empty shell. Each page also renders its text and links into #root; the app
# replaces them as soon as it starts. Until then CSS keeps them visually hidden,
# and a <noscript> style in index.html shows them.


def post_blocks(body: str) -> list[dict]:
    """The blog's plain-text markup (front/src/lib/markup.ts) as content blocks."""
    blocks: list[dict] = []
    for chunk in body.split("\n\n"):
        text = chunk.strip()
        lines = text.splitlines()
        if text.startswith("## "):
            blocks.append({"h2": text[3:]})
        elif lines and all(line.startswith("- ") for line in lines):
            blocks.append({"ul": [line[2:] for line in lines]})
        elif text:
            blocks.append({"p": text})
    return blocks


def page_content(current: Page, site_name: str) -> str:
    if not current.content:
        return ""

    lang = current.lang
    other = "en" if lang == "uk" else "uk"
    copy = COPY[lang]
    nav = [
        {"href": localized("/", lang), "text": site_name},
        {"href": localized(BLOG_PATH, lang), "text": copy["blog"]},
        {"href": localized(PRIVACY_PATH, lang), "text": copy["privacy"]},
    ]
    if other in current.languages:
        nav.append({"href": localized(current.path, other), "text": copy["other_language"], "lang": other})
    return render_to_string("seo/content.html", {**current.content, "nav": nav})


def home_blocks(site: SiteSettings, lang: str) -> list[dict]:
    copy = COPY[lang]
    blocks: list[dict] = []

    services = Service.objects.all()
    if services:
        blocks.append({"h2": copy["services"]})
        for service in services:
            blocks.append(
                {
                    "links": [
                        {
                            "href": localized(service.get_absolute_url(), lang),
                            "text": translated(service, "title", lang),
                        }
                    ]
                }
            )
            facts = filter(None, (translated(service, "price_from", lang), translated(service, "duration", lang)))
            blocks.append({"p": " · ".join(facts)})
            blocks.append({"p": translated(service, "description", lang)})
            deliverables = [line.strip() for line in translated(service, "deliverables", lang).splitlines()]
            blocks.append({"ul": [line for line in deliverables if line]})

    projects = Project.objects.all()
    if projects:
        blocks.append({"h2": copy["cases"]})
        blocks.append(
            {
                "links": [
                    {
                        "href": localized(project.get_absolute_url(), lang),
                        "text": translated(project, "title", lang),
                        "note": translated(project, "description", lang),
                    }
                    for project in projects
                ]
            }
        )

    site_types = SiteType.objects.prefetch_related("examples")
    if site_types:
        blocks.append({"h2": copy["site_types"]})
        for kind in site_types:
            blocks.append({"h3": translated(kind, "title", lang)})
            blocks.append({"p": translated(kind, "description", lang)})
            for field in ("audience", "formats"):
                lines = [line.strip() for line in translated(kind, field, lang).splitlines()]
                blocks.append({"ul": [line for line in lines if line]})

    steps = ProcessStep.objects.all()
    if steps:
        blocks.append({"h2": copy["process"]})
        for step in steps:
            title = translated(step, "title", lang)
            duration = translated(step, "duration", lang)
            blocks.append({"p": f"{title} ({duration}): {translated(step, 'description', lang)}"})

    faq = FaqItem.objects.all()
    if faq:
        blocks.append({"h2": copy["faq"]})
        for item in faq:
            blocks.append({"p": f"{translated(item, 'question', lang)}\n{translated(item, 'answer', lang)}"})

    posts = [post for post in Post.published.all() if lang == DEFAULT_LANGUAGE or has_english(post)]
    if posts:
        blocks.append({"h2": copy["blog"]})
        blocks.append(
            {
                "links": [
                    {
                        "href": localized(post.get_absolute_url(), lang),
                        "text": translated(post, "title", lang),
                        "note": translated(post, "excerpt", lang),
                    }
                    for post in posts
                ]
            }
        )

    contacts = [{"href": social.url, "text": social.name} for social in SocialLink.objects.all()]
    if site.email:
        contacts.insert(0, {"href": f"mailto:{site.email}", "text": site.email})
    if contacts:
        blocks += [{"h2": copy["contact"]}, {"links": contacts}]
    return blocks


# --- pages ---------------------------------------------------------------------


def home_page(site: SiteSettings, lang: str) -> Page:
    faq = faq_jsonld(lang)
    services = services_jsonld(lang)
    tagline = translated(site, "tagline", lang)
    summary = translated(site, "seo_description", lang) or translated(site, "description", lang) or tagline
    return Page(
        title=translated(site, "seo_title", lang) or f"{site.name} — {tagline}",
        description=strip_tags(summary)[:300],
        path="/",
        lang=lang,
        nodes=[node for node in (faq, services) if node],
        content={
            "heading": tagline,
            "intro": translated(site, "description", lang),
            "blocks": home_blocks(site, lang),
        },
        preload_image=site.hero_poster.url if site.hero_poster else "",
    )


def service_page(service: Service, site_name: str, lang: str = DEFAULT_LANGUAGE) -> Page:
    copy = COPY[lang]
    headline = translated(service, "headline", lang) or translated(service, "title", lang)
    description = translated(service, "description", lang)
    questions = list(service.questions.all())
    path = localized(service.get_absolute_url(), lang)
    facts = filter(None, (translated(service, "price_from", lang), translated(service, "duration", lang)))
    deliverables = [line.strip() for line in translated(service, "deliverables", lang).splitlines() if line.strip()]
    projects = service.projects.all()

    blocks: list[dict] = [{"p": " · ".join(facts)}, {"h2": copy["included"]}, {"ul": deliverables}]
    blocks += post_blocks(translated(service, "details", lang))
    if projects:
        blocks += [
            {"h2": copy["cases"]},
            {
                "links": [
                    {"href": localized(project.get_absolute_url(), lang), "text": translated(project, "title", lang)}
                    for project in projects
                ]
            },
        ]
    if questions:
        blocks.append({"h2": copy["faq"]})
        blocks += [
            {"p": f"{translated(item, 'question', lang)}\n{translated(item, 'answer', lang)}"} for item in questions
        ]

    faq = faq_jsonld(lang, questions) if questions else None
    return Page(
        title=translated(service, "seo_title", lang) or f"{headline} | {site_name}",
        description=strip_tags(translated(service, "seo_description", lang) or description or headline)[:300],
        path=service.get_absolute_url(),
        lang=lang,
        content={"heading": headline, "intro": translated(service, "intro", lang) or description, "blocks": blocks},
        nodes=[
            service_jsonld(service, lang),
            breadcrumbs_jsonld((copy["home"], localized("/", lang)), (headline, path)),
            *([faq] if faq else []),
        ],
    )


def case_page(project: Project, site_name: str, lang: str = DEFAULT_LANGUAGE) -> Page:
    copy = COPY[lang]
    title = translated(project, "title", lang)
    description = translated(project, "description", lang)
    path = localized(project.get_absolute_url(), lang)
    return Page(
        title=f"{title} | {copy['case']} {site_name}",
        description=strip_tags(description or title)[:300],
        path=project.get_absolute_url(),
        lang=lang,
        image=file_url(project.image),
        content={
            "heading": title,
            "intro": description,
            "blocks": [
                *(
                    {"p": text}
                    for text in (
                        translated(project, "challenge", lang),
                        translated(project, "solution", lang),
                        translated(project, "result", lang),
                    )
                    if text
                ),
                {
                    "ul": [
                        f"{translated(metric, 'value', lang)} — {translated(metric, 'label', lang)}"
                        for metric in project.metrics.all()
                    ]
                },
                {"p": project.stack},
            ],
        },
        nodes=[
            compact(
                {
                    "@type": "CreativeWork",
                    "name": title,
                    "description": strip_tags(description)[:300],
                    "url": absolute(path),
                    "image": file_url(project.image),
                    "dateCreated": str(project.year) if project.year else None,
                    "keywords": project.stack,
                    "creator": {"@id": absolute("/#organization")},
                }
            ),
            breadcrumbs_jsonld((copy["home"], localized("/", lang)), (title, path)),
        ],
    )


def blog_page(site_name: str, lang: str = DEFAULT_LANGUAGE) -> Page:
    copy = COPY[lang]
    blog = localized(BLOG_PATH, lang)
    return Page(
        title=copy["blog_title"].format(site=site_name),
        description=copy["blog_description"],
        path=BLOG_PATH,
        lang=lang,
        content={
            "heading": f"{copy['blog']} {site_name}",
            "intro": copy["blog_description"],
            "blocks": [
                {
                    "links": [
                        {
                            "href": localized(post.get_absolute_url(), lang),
                            "text": translated(post, "title", lang),
                            "note": translated(post, "excerpt", lang),
                        }
                        for post in Post.published.all()
                        if lang == DEFAULT_LANGUAGE or has_english(post)
                    ]
                }
            ],
        },
        nodes=[
            {
                "@type": "Blog",
                "@id": absolute(blog),
                "name": f"{copy['blog']} {site_name}",
                "url": absolute(blog),
                "inLanguage": lang,
            },
            breadcrumbs_jsonld((copy["home"], localized("/", lang)), (copy["blog"], blog)),
        ],
    )


def post_author_jsonld(post: Post, lang: str) -> dict:
    """The named author when there is one, otherwise the studio itself."""
    if not post.author:
        return {"@id": absolute("/#organization")}
    return compact(
        {
            "@type": "Person",
            "name": post.author,
            "jobTitle": translated(post, "author_role", lang),
            "worksFor": {"@id": absolute("/#organization")},
        }
    )


def post_page(post: Post, site_name: str, lang: str = DEFAULT_LANGUAGE) -> Page:
    copy = COPY[lang]
    title = translated(post, "title", lang)
    excerpt = translated(post, "excerpt", lang)
    path = localized(post.get_absolute_url(), lang)
    blog = localized(BLOG_PATH, lang)
    return Page(
        title=f"{title} | {site_name}",
        description=strip_tags(excerpt)[:300],
        path=post.get_absolute_url(),
        lang=lang,
        image=file_url(post.cover),
        og_type="article",
        languages=("uk", "en") if has_english(post) else ("uk",),
        content={"heading": title, "intro": excerpt, "blocks": post_blocks(translated(post, "body", lang))},
        nodes=[
            compact(
                {
                    "@type": "BlogPosting",
                    "headline": title,
                    "description": strip_tags(excerpt),
                    "url": absolute(path),
                    "mainEntityOfPage": absolute(path),
                    "image": file_url(post.cover) or absolute(static(DEFAULT_OG_IMAGE)),
                    "datePublished": post.published_at.isoformat(),
                    "dateModified": post.updated_at.isoformat(),
                    "inLanguage": lang,
                    "author": post_author_jsonld(post, lang),
                    "publisher": {"@id": absolute("/#organization")},
                    "isPartOf": {"@id": absolute(blog)},
                }
            ),
            breadcrumbs_jsonld((copy["home"], localized("/", lang)), (copy["blog"], blog), (title, path)),
        ],
    )


def privacy_page(site_name: str, lang: str = DEFAULT_LANGUAGE) -> Page:
    copy = COPY[lang]
    return Page(
        title=f"{copy['privacy']} | {site_name}",
        description=copy["privacy_description"],
        path=PRIVACY_PATH,
        lang=lang,
        content={"heading": copy["privacy"], "intro": copy["privacy_description"], "blocks": []},
    )


def not_found_page(site_name: str, lang: str = DEFAULT_LANGUAGE) -> Page:
    """What a dead URL tells crawlers: nothing to index, no other versions of it."""
    return Page(
        title=f"{COPY[lang]['not_found']} | {site_name}",
        description="",
        path="/",
        lang=lang,
        languages=(),
        noindex=True,
    )


def build_seo_context(page: Callable[[str], Page] | None = None, lang: str = DEFAULT_LANGUAGE) -> dict:
    """Title, meta description, social tags and schema.org data for one URL.

    `page` builds the page from the site name (already bound to `lang`);
    without it, the home page.
    """
    site = SiteSettings.objects.order_by("id").last()
    site_name = site.name if site else site_domain()

    if page is not None:
        current = page(site_name)
    elif site is not None:
        current = home_page(site, lang)
    else:
        current = Page(title=site_name, description="", path="/", lang=lang)

    graph = [website_jsonld(site, lang)]
    if site is not None:
        graph.append(organization_jsonld(site, lang))
    graph += current.nodes

    image = current.image or file_url(site.og_image if site else None) or absolute(static(DEFAULT_OG_IMAGE))

    return {
        "title": current.title,
        "site_name": site_name,
        "description": current.description,
        "canonical": "" if current.noindex else absolute(localized(current.path, current.lang)),
        "robots": "noindex" if current.noindex else "index, follow, max-image-preview:large",
        "body": page_content(current, site_name),
        "preload_image": current.preload_image,
        "image": image,
        "og_type": current.og_type,
        "lang": current.lang,
        "locale": OG_LOCALE[current.lang],
        "locale_alternate": OG_LOCALE["en" if current.lang == "uk" else "uk"] if len(current.languages) > 1 else "",
        # hreflang alternates; empty when the page has no version in that language.
        "url_uk": absolute(current.path) if "uk" in current.languages else "",
        "url_en": absolute(localized(current.path, "en")) if "en" in current.languages else "",
        # Escape "<" so content such as "</script>" cannot close the JSON-LD tag.
        "jsonld": json.dumps({"@context": "https://schema.org", "@graph": graph}, ensure_ascii=False).replace(
            "<", "\\u003c"
        ),
    }


def render_spa(
    request, page: Callable[[str], Page] | None = None, status: int = 200, lang: str = DEFAULT_LANGUAGE
) -> HttpResponse:
    try:
        return render(request, "index.html", {"seo": build_seo_context(page, lang)}, status=status)
    except TemplateDoesNotExist:
        return HttpResponse(MISSING_BUILD_MESSAGE, status=501)


# Unknown URLs still get the shell (the SPA renders its own "not found" screen)
# but with a 404 status and noindex, so crawlers do not index them.


def render_not_found(request, lang: str) -> HttpResponse:
    return render_spa(request, partial(not_found_page, lang=lang), status=404, lang=lang)


def page_not_found(request, exception) -> HttpResponse:
    """`handler404`: site URLs get the designed page; API and file paths a bare 404."""
    if request.path.startswith(("/api/", "/admin/", "/media/", "/static/")):
        return HttpResponseNotFound("Not found", content_type="text/plain")
    return render_not_found(request, "en" if request.path.startswith("/en/") else DEFAULT_LANGUAGE)


# Each view takes `lang` from its URL pattern (config/urls.py mounts them twice).


@require_safe
def spa(request, lang: str = DEFAULT_LANGUAGE):
    """Serve the built SPA shell with database-driven meta tags."""
    return render_spa(request, lang=lang)


@require_safe
def case(request, slug: str, lang: str = DEFAULT_LANGUAGE):
    project = Project.objects.filter(slug=slug).first()
    if project is None:
        return render_not_found(request, lang)
    return render_spa(request, partial(case_page, project, lang=lang), lang=lang)


@require_safe
def service(request, slug: str, lang: str = DEFAULT_LANGUAGE):
    found = Service.objects.filter(slug=slug).first()
    if found is None:
        return render_not_found(request, lang)
    return render_spa(request, partial(service_page, found, lang=lang), lang=lang)


@require_safe
def blog(request, lang: str = DEFAULT_LANGUAGE):
    return render_spa(request, partial(blog_page, lang=lang), lang=lang)


@require_safe
def privacy(request, lang: str = DEFAULT_LANGUAGE):
    return render_spa(request, partial(privacy_page, lang=lang), lang=lang)


@require_safe
def blog_post(request, slug: str, lang: str = DEFAULT_LANGUAGE):
    article = Post.published.filter(slug=slug).first()
    if article is None or (lang != DEFAULT_LANGUAGE and not has_english(article)):
        return render_not_found(request, lang)
    return render_spa(request, partial(post_page, article, lang=lang), lang=lang)


@require_safe
def robots_txt(request):
    # /api/site/ stays crawlable: Google renders the SPA, and a disallowed data
    # endpoint would leave every page empty for it.
    lines = [
        "User-agent: *",
        "Disallow: /admin/",
        "Disallow: /api/message/",
        "Disallow: /api/subscribe/",
        "",
        f"Sitemap: {absolute('/sitemap.xml')}",
        "",
    ]
    return HttpResponse("\n".join(lines), content_type="text/plain")


@require_safe
def sitemap_xml(request):
    """Every public URL in every language it exists in, linked as alternates. Add new routes here."""
    posts = list(Post.published.all())
    both = tuple(LANGUAGE_PREFIX)
    entries: list[tuple[str, datetime | None, tuple[str, ...]]] = [
        ("/", None, both),
        (PRIVACY_PATH, None, both),
        (BLOG_PATH, max((post.updated_at for post in posts), default=None), both),
        *((item.get_absolute_url(), None, both) for item in Service.objects.only("slug")),
        *((project.get_absolute_url(), None, both) for project in Project.objects.only("slug")),
        *((post.get_absolute_url(), post.updated_at, both if has_english(post) else ("uk",)) for post in posts),
    ]

    def entry(path: str, modified: datetime | None, languages: tuple[str, ...], lang: str) -> str:
        alternates = "".join(
            f'<xhtml:link rel="alternate" hreflang="{other}" href="{escape(absolute(localized(path, other)))}"/>'
            for other in languages
        )
        if len(languages) > 1:
            alternates += f'<xhtml:link rel="alternate" hreflang="x-default" href="{escape(absolute(path))}"/>'
        return (
            f"<url><loc>{escape(absolute(localized(path, lang)))}</loc>"
            + (f"<lastmod>{modified.date().isoformat()}</lastmod>" if modified else "")
            + (alternates if len(languages) > 1 else "")
            + "</url>"
        )

    urls = "".join(entry(*item, lang) for item in entries for lang in item[2])
    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
        f"{urls}</urlset>"
    )
    return HttpResponse(xml, content_type="application/xml")
