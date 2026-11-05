from django.contrib import admin

from main.models import (
    TRANSLATED_FIELDS,
    Fact,
    FaqItem,
    Message,
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
    Subscriber,
    english_name,
    has_english,
)

admin.site.site_header = "Адмінка bruf"
admin.site.site_title = "bruf"
admin.site.index_title = "Контент сайту"


def english_fieldset(model) -> tuple[str, dict]:
    """The model's `_en` fields, folded away under one heading."""
    return (
        "English — для /en/ (порожнє поле = український текст)",
        {"classes": ["collapse"], "fields": [english_name(name) for name in TRANSLATED_FIELDS[model]]},
    )


@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ["name", "email", "phone"]
    fieldsets = [
        (None, {"fields": ["name", "tagline", "description", "availability"]}),
        ("Пошук", {"fields": ["seo_title", "seo_description"]}),
        ("Фонове відео першого екрана", {"fields": ["hero_video", "hero_poster"]}),
        ("Контакти", {"fields": ["email", "phone", "address"]}),
        ("Бренд і соцмережі", {"fields": ["logo", "og_image"]}),
        english_fieldset(SiteSettings),
    ]

    def has_add_permission(self, request) -> bool:
        # The site reads a single row; edit it instead of adding another.
        return not SiteSettings.objects.exists()


class ServiceQuestionInline(admin.StackedInline):
    model = ServiceQuestion
    extra = 0


@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ["title", "price_from", "duration", "order"]
    list_editable = ["order"]
    search_fields = ["title", "description"]
    inlines = [ServiceQuestionInline]
    fieldsets = [
        (None, {"fields": ["title", "description", "deliverables", "price_from", "duration", "order"]}),
        ("Сторінка послуги", {"fields": ["slug", "headline", "intro", "details"]}),
        ("Пошук", {"fields": ["seo_title", "seo_description"]}),
        english_fieldset(Service),
    ]


class ProjectMetricInline(admin.TabularInline):
    model = ProjectMetric
    extra = 0


class ProjectImageInline(admin.TabularInline):
    model = ProjectImage
    extra = 0


@admin.register(Project)
class ProjectAdmin(admin.ModelAdmin):
    list_display = ["title", "client", "category", "year", "order"]
    list_editable = ["order"]
    list_filter = ["category", "year"]
    search_fields = ["title", "client", "description"]
    prepopulated_fields = {"slug": ["title"]}
    inlines = [ProjectMetricInline, ProjectImageInline]
    fieldsets = [
        (None, {"fields": ["title", "slug", "service", "client", "category", "year", "url", "order"]}),
        ("Картка", {"fields": ["description", "image", "video", "color"]}),
        ("Кейс", {"fields": ["challenge", "solution", "result", "stack"]}),
        english_fieldset(Project),
    ]


@admin.register(SiteType)
class SiteTypeAdmin(admin.ModelAdmin):
    list_display = ["title", "order"]
    list_editable = ["order"]
    filter_horizontal = ["examples"]
    fieldsets = [
        (None, {"fields": ["title", "description", "audience", "formats_title", "formats", "examples", "order"]}),
        english_fieldset(SiteType),
    ]


@admin.register(ProcessStep)
class ProcessStepAdmin(admin.ModelAdmin):
    list_display = ["title", "duration", "order"]
    list_editable = ["order"]
    fieldsets = [(None, {"fields": ["title", "description", "duration", "order"]}), english_fieldset(ProcessStep)]


@admin.register(Fact)
class FactAdmin(admin.ModelAdmin):
    list_display = ["value", "label", "order"]
    list_editable = ["order"]
    fieldsets = [(None, {"fields": ["value", "label", "order"]}), english_fieldset(Fact)]


@admin.register(FaqItem)
class FaqItemAdmin(admin.ModelAdmin):
    list_display = ["question", "order"]
    list_editable = ["order"]
    search_fields = ["question", "answer"]
    fieldsets = [(None, {"fields": ["question", "answer", "order"]}), english_fieldset(FaqItem)]


@admin.register(Post)
class PostAdmin(admin.ModelAdmin):
    list_display = ["title", "category", "is_featured", "published_at", "is_published", "in_english"]
    list_editable = ["is_published"]
    list_filter = ["is_published", "category"]
    search_fields = ["title", "excerpt", "body"]
    prepopulated_fields = {"slug": ["title"]}
    date_hierarchy = "published_at"
    fieldsets = [
        (None, {"fields": ["title", "slug", "excerpt", "category", "cover"]}),
        ("Текст", {"fields": ["body"]}),
        ("Автор", {"fields": ["author", "author_role"]}),
        ("Публікація", {"fields": ["published_at", "is_published", "is_featured"]}),
        (
            "English — стаття з'явиться на /en/blog/, коли заповнені заголовок і текст",
            {"classes": ["collapse"], "fields": [english_name(name) for name in TRANSLATED_FIELDS[Post]]},
        ),
    ]

    @admin.display(description="EN", boolean=True)
    def in_english(self, post: Post) -> bool:
        return has_english(post)


@admin.register(SocialLink)
class SocialLinkAdmin(admin.ModelAdmin):
    list_display = ["name", "url", "order"]
    list_editable = ["order"]


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ["name", "project_type", "contact_method", "contact", "budget", "created_at", "is_read"]
    list_editable = ["is_read"]
    list_filter = ["is_read", "contact_method", "budget", "created_at"]
    search_fields = ["name", "email", "phone", "message", "project_type"]
    readonly_fields = ["name", "project_type", "contact_method", "email", "phone", "budget", "message", "created_at"]

    @admin.display(description="контакт")
    def contact(self, message: Message) -> str:
        by_phone = message.contact_method in (Message.ContactMethod.TELEGRAM, Message.ContactMethod.PHONE)
        return message.phone if by_phone else message.email

    def has_add_permission(self, request) -> bool:
        return False


@admin.register(Subscriber)
class SubscriberAdmin(admin.ModelAdmin):
    list_display = ["email", "created_at"]
    search_fields = ["email"]
    readonly_fields = ["email", "created_at"]

    def has_add_permission(self, request) -> bool:
        return False
