from django.db import models
from rest_framework import serializers

from main.models import (
    DEFAULT_LANGUAGE,
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
    translated,
)


class LinesField(serializers.Field):
    """A multi-line text field exposed as a list of its non-empty lines."""

    def to_representation(self, value: str) -> list[str]:
        return [line.strip() for line in value.splitlines() if line.strip()]


class CommaListField(serializers.Field):
    """A comma-separated text field exposed as a list."""

    def to_representation(self, value: str) -> list[str]:
        return [item.strip() for item in value.split(",") if item.strip()]


class TranslatedSerializer(serializers.ModelSerializer):
    """Swaps translatable fields for their `_en` twins when `context["lang"]` is "en"."""

    def to_representation(self, instance):
        data = super().to_representation(instance)
        lang = self.context.get("lang", DEFAULT_LANGUAGE)
        if lang != DEFAULT_LANGUAGE:
            for name in TRANSLATED_FIELDS.get(type(instance), ()):
                if name in self.fields:
                    data[name] = self.fields[name].to_representation(translated(instance, name, lang))
        return data


class SiteSettingsSerializer(TranslatedSerializer):
    class Meta:
        model = SiteSettings
        fields = [
            "name",
            "tagline",
            "seo_title",
            "description",
            "availability",
            "hero_video",
            "hero_poster",
            "email",
            "phone",
            "address",
            "logo",
        ]


class ServiceQuestionSerializer(TranslatedSerializer):
    class Meta:
        model = ServiceQuestion
        fields = ["id", "question", "answer"]


class ServiceSerializer(TranslatedSerializer):
    deliverables = LinesField(read_only=True)
    questions = ServiceQuestionSerializer(many=True, read_only=True)

    class Meta:
        model = Service
        fields = [
            "id",
            "slug",
            "title",
            "headline",
            "seo_title",
            "intro",
            "details",
            "description",
            "deliverables",
            "price_from",
            "duration",
            "questions",
        ]


class ProjectMetricSerializer(TranslatedSerializer):
    class Meta:
        model = ProjectMetric
        fields = ["value", "label"]


class ProjectImageSerializer(TranslatedSerializer):
    class Meta:
        model = ProjectImage
        fields = ["image", "caption"]


class ProjectSerializer(TranslatedSerializer):
    stack = CommaListField(read_only=True)
    metrics = ProjectMetricSerializer(many=True, read_only=True)
    gallery = ProjectImageSerializer(many=True, read_only=True)

    class Meta:
        model = Project
        fields = [
            "id",
            "slug",
            "title",
            "service",
            "client",
            "category",
            "year",
            "description",
            "challenge",
            "solution",
            "result",
            "stack",
            "metrics",
            "gallery",
            "image",
            "video",
            "color",
            "url",
        ]


class ProcessStepSerializer(TranslatedSerializer):
    class Meta:
        model = ProcessStep
        fields = ["id", "title", "description", "duration"]


class FactSerializer(TranslatedSerializer):
    class Meta:
        model = Fact
        fields = ["id", "value", "label"]


class SiteTypeSerializer(TranslatedSerializer):
    audience = LinesField(read_only=True)
    formats = LinesField(read_only=True)
    examples = serializers.SlugRelatedField(many=True, read_only=True, slug_field="slug")

    class Meta:
        model = SiteType
        fields = ["id", "title", "description", "audience", "formats_title", "formats", "examples"]


class FaqItemSerializer(TranslatedSerializer):
    class Meta:
        model = FaqItem
        fields = ["id", "question", "answer"]


class PostSerializer(TranslatedSerializer):
    class Meta:
        model = Post
        fields = [
            "id",
            "slug",
            "title",
            "excerpt",
            "body",
            "category",
            "cover",
            "is_featured",
            "author",
            "author_role",
            "published_at",
            "updated_at",
        ]


class SocialLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = SocialLink
        fields = ["id", "name", "url"]


class SiteSerializer(serializers.Serializer):
    """The whole site payload, delivered by `GET /api/site/` in a single request."""

    settings = SiteSettingsSerializer(read_only=True)
    services = ServiceSerializer(many=True, read_only=True)
    projects = ProjectSerializer(many=True, read_only=True)
    site_types = SiteTypeSerializer(many=True, read_only=True)
    process = ProcessStepSerializer(many=True, read_only=True)
    facts = FactSerializer(many=True, read_only=True)
    faq = FaqItemSerializer(many=True, read_only=True)
    posts = PostSerializer(many=True, read_only=True)
    socials = SocialLinkSerializer(many=True, read_only=True)


# Validation messages for the two public forms, per site language.
MESSAGES = {
    "uk": {
        "name_short": "Ім'я має містити щонайменше 2 символи.",
        "project_type": "Оберіть тип сайту зі списку.",
        "email_required": "Вкажіть email, щоб ми могли відповісти.",
        "telegram_required": "Вкажіть нік або номер у Telegram.",
        "phone_required": "Вкажіть номер телефону.",
        "email_invalid": "Перевірте email — схоже, в ньому помилка.",
    },
    "en": {
        "name_short": "The name should be at least 2 characters long.",
        "project_type": "Pick a website type from the list.",
        "email_required": "Leave an email so we can reply.",
        "telegram_required": "Leave your Telegram username or number.",
        "phone_required": "Leave a phone number.",
        "email_invalid": "Check the email — it looks like there is a typo.",
    },
}


class LocalizedErrorsMixin:
    def message(self, key: str) -> str:
        return MESSAGES.get(self.context.get("lang"), MESSAGES[DEFAULT_LANGUAGE])[key]


class MessageSerializer(LocalizedErrorsMixin, serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "name", "project_type", "contact_method", "email", "phone", "budget", "message"]

    def validate_name(self, value: str) -> str:
        if len(value.strip()) < 2:
            raise serializers.ValidationError(self.message("name_short"))
        return value

    def validate_project_type(self, value: str) -> str:
        """A service title in either language, or "other" in either language."""
        if not value or value in Message.OTHER_PROJECT_TYPES:
            return value
        if not Service.objects.filter(models.Q(title=value) | models.Q(title_en=value)).exists():
            raise serializers.ValidationError(self.message("project_type"))
        return value

    def validate(self, attrs: dict) -> dict:
        """Require the one contact the visitor asked to be reached by.

        Without a method (older clients), email is the contact, as it always was.
        """
        method = attrs.get("contact_method") or Message.ContactMethod.EMAIL
        if method == Message.ContactMethod.EMAIL:
            if not attrs.get("email"):
                raise serializers.ValidationError({"email": self.message("email_required")})
        elif not attrs.get("phone", "").strip():
            key = "telegram_required" if method == Message.ContactMethod.TELEGRAM else "phone_required"
            raise serializers.ValidationError({"phone": self.message(key)})
        return attrs


class SubscribeSerializer(LocalizedErrorsMixin, serializers.Serializer):
    """Newsletter sign-up. Signing up twice is not an error: the address is simply kept."""

    email = serializers.EmailField()

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["email"].error_messages["invalid"] = self.message("email_invalid")

    def create(self, validated_data: dict) -> Subscriber:
        subscriber, _ = Subscriber.objects.get_or_create(email=validated_data["email"].strip().lower())
        return subscriber
