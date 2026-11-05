from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

from main.models import (
    DEFAULT_LANGUAGE,
    LANGUAGES,
    Fact,
    FaqItem,
    Post,
    ProcessStep,
    Project,
    Service,
    SiteSettings,
    SiteType,
    SocialLink,
    has_english,
)
from main.notify import notify_new_lead
from main.serializers import MessageSerializer, SiteSerializer, SubscribeSerializer

SITE_CACHE_KEY = "api:site"

# A form field people never see (ContactForm.tsx); only bots fill it in.
HONEYPOT_FIELD = "hp_field"


def site_cache_key(lang: str) -> str:
    return f"{SITE_CACHE_KEY}:{lang}"


def request_language(request) -> str:
    """`?lang=en` picks the English site; anything else is Ukrainian."""
    lang = request.query_params.get("lang", DEFAULT_LANGUAGE)
    return lang if lang in LANGUAGES else DEFAULT_LANGUAGE


def build_site_payload(lang: str = DEFAULT_LANGUAGE) -> dict:
    """Serialize every piece of site content into one JSON-ready dict.

    Deliberately built without a request in the serializer context: DRF would
    then turn every file field into an absolute URL derived from the *current*
    request's host. Since this payload is cached and reused, whichever request
    happened to miss the cache would decide the image URLs everyone else sees —
    and the container healthcheck (Host: 127.0.0.1:8000) is a frequent winner.
    Relative `/media/...` paths are correct for every caller: the SPA is served
    from the same origin, and the dev server proxies /media through.
    """
    data = {
        "settings": SiteSettings.objects.order_by("id").last(),
        "services": Service.objects.prefetch_related("questions"),
        "projects": Project.objects.prefetch_related("metrics", "gallery"),
        "site_types": SiteType.objects.prefetch_related("examples"),
        "process": ProcessStep.objects.all(),
        "facts": Fact.objects.all(),
        "faq": FaqItem.objects.all(),
        # Full bodies ride along: fine for a small blog, split into its own
        # endpoint once the payload grows noticeably.
        # The English blog lists only translated articles.
        "posts": [post for post in Post.published.all() if lang == DEFAULT_LANGUAGE or has_english(post)],
        "socials": SocialLink.objects.all(),
    }
    return SiteSerializer(data, context={"lang": lang}).data


class SiteView(APIView):
    """`GET /api/site/?lang=uk|en` — the single call the SPA makes on load.

    The response is cached and invalidated by model signals (main/signals.py),
    so repeat visits never touch the database.
    """

    def get(self, request, *args, **kwargs):
        lang = request_language(request)
        payload = cache.get(site_cache_key(lang))
        if payload is None:
            payload = build_site_payload(lang)
            cache.set(site_cache_key(lang), payload)
        return Response(payload, status=status.HTTP_200_OK)


class MessageView(APIView):
    """`POST /api/message/` — stores a contact-form submission."""

    throttle_scope = "message"

    def post(self, request, *args, **kwargs):
        lang = request_language(request)
        detail = "Message sent." if lang == "en" else "Заявку надіслано."
        # Bots get the usual answer, so they have no reason to try another way in.
        if request.data.get(HONEYPOT_FIELD):
            return Response({"detail": detail}, status=status.HTTP_201_CREATED)

        serializer = MessageSerializer(data=request.data, context={"lang": lang})
        serializer.is_valid(raise_exception=True)
        notify_new_lead(serializer.save())
        return Response({"detail": detail}, status=status.HTTP_201_CREATED)


class SubscribeView(APIView):
    """`POST /api/subscribe/` — newsletter sign-up from the blog."""

    throttle_scope = "subscribe"

    def post(self, request, *args, **kwargs):
        lang = request_language(request)
        serializer = SubscribeSerializer(data=request.data, context={"lang": lang})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        if lang == "en":
            detail = "Done — new articles will come to your inbox."
        else:
            detail = "Готово — нові статті прийдуть на пошту."
        return Response({"detail": detail}, status=status.HTTP_201_CREATED)
