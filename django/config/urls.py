"""Root URL configuration.

`/api/`   — JSON API consumed by the SPA
`/admin/` — content management
`/`, `/services/<slug>/`, `/cases/<slug>/`, `/blog/`, `/blog/<slug>/` — the SPA shell with server-side SEO tags
`/en/...` — the same pages in English
"""

from django.contrib import admin
from django.templatetags.static import static
from django.urls import include, path
from django.views.generic import RedirectView

from main import seo
from main.media import serve_media

handler404 = "main.seo.page_not_found"

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include("main.urls")),
    path("robots.txt", seo.robots_txt, name="robots"),
    path("sitemap.xml", seo.sitemap_xml, name="sitemap"),
    # User-uploaded content. WhiteNoise handles /static/; media is dynamic, so
    # Django serves it directly, with Range support for Safari video.
    path("media/<path:path>", serve_media, name="media"),
    path("cases/<slug:slug>/", seo.case, name="case"),
    path("services/<slug:slug>/", seo.service, name="service"),
    path("blog/", seo.blog, name="blog"),
    path("privacy/", seo.privacy, name="privacy"),
    path("blog/<slug:slug>/", seo.blog_post, name="post"),
    # The English site: the same pages under /en/.
    path("en/", seo.spa, {"lang": "en"}, name="spa-en"),
    path("en/cases/<slug:slug>/", seo.case, {"lang": "en"}, name="case-en"),
    path("en/services/<slug:slug>/", seo.service, {"lang": "en"}, name="service-en"),
    path("en/blog/", seo.blog, {"lang": "en"}, name="blog-en"),
    path("en/privacy/", seo.privacy, {"lang": "en"}, name="privacy-en"),
    path("en/blog/<slug:slug>/", seo.blog_post, {"lang": "en"}, name="post-en"),
    # Browsers and crawlers ask for /favicon.ico regardless of <link rel="icon">.
    path("favicon.ico", RedirectView.as_view(url=static("favicon.ico"), permanent=True)),
    path("", seo.spa, name="spa"),
]
