"""Keep the cached `/api/site/` payload in sync with admin edits."""

from django.core.cache import cache
from django.db.models.signals import post_delete, post_save
from django.dispatch import receiver

from main.models import (
    LANGUAGES,
    Fact,
    FaqItem,
    Post,
    ProcessStep,
    Project,
    ProjectImage,
    ProjectMetric,
    Service,
    ServiceQuestion,
    SiteSettings,
    SiteType,
    SocialLink,
)
from main.views import site_cache_key

# Every model that ends up in the /api/site/ payload. Add new ones here.
CONTENT_MODELS = (
    SiteSettings,
    Service,
    ServiceQuestion,
    Project,
    ProjectMetric,
    ProjectImage,
    SiteType,
    ProcessStep,
    Fact,
    FaqItem,
    Post,
    SocialLink,
)


@receiver(post_save)
@receiver(post_delete)
def invalidate_on_change(sender, **kwargs) -> None:
    if sender in CONTENT_MODELS:
        cache.delete_many([site_cache_key(lang) for lang in LANGUAGES])
