from django.core.validators import FileExtensionValidator, RegexValidator
from django.db import models
from django.utils import timezone

VIDEO_VALIDATOR = FileExtensionValidator(["mp4", "webm"])
HEX_COLOR_VALIDATOR = RegexValidator(r"^#[0-9a-fA-F]{6}$", "Колір у форматі #RRGGBB.")

ORDER_HELP = "Менше значення — вище у списку"


class OrderedModel(models.Model):
    """Rows the admin sorts by hand."""

    order = models.PositiveSmallIntegerField("порядок", default=0, help_text=ORDER_HELP)

    class Meta:
        abstract = True
        ordering = ["order", "id"]


class SiteSettings(models.Model):
    """Studio-wide content: name, hero copy, contacts. One row is expected."""

    name = models.CharField("назва студії", max_length=100)
    tagline = models.CharField("слоган", max_length=200, help_text="Головний заголовок на першому екрані")
    seo_title = models.CharField(
        "заголовок для пошуку",
        max_length=70,
        blank=True,
        help_text="<title> головної в Google, до ~60 символів. Порожнє — «назва — слоган»",
    )
    seo_description = models.CharField(
        "опис для пошуку",
        max_length=170,
        blank=True,
        help_text="Meta description головної в Google, до ~155 символів. Порожнє — «опис»",
    )
    description = models.TextField("опис", blank=True, help_text="Текст під заголовком на першому екрані")
    availability = models.CharField(
        "статус завантаженості",
        max_length=120,
        blank=True,
        help_text="Коротка плашка на першому екрані, напр. «Беремо 2 проєкти на грудень»",
    )
    hero_video = models.FileField(
        "фонове відео",
        upload_to="site/",
        blank=True,
        validators=[VIDEO_VALIDATOR],
        help_text="MP4 (H.264) без звуку, до ~3 МБ, 15–30 с у циклі. Фон першого екрана, показується знебарвленим",
    )
    hero_poster = models.ImageField(
        "кадр фонового відео",
        upload_to="site/",
        blank=True,
        help_text="Видно до завантаження відео і для тих, хто вимкнув анімації",
    )
    email = models.EmailField("email", blank=True)
    phone = models.CharField("телефон", max_length=40, blank=True)
    address = models.CharField("адреса", max_length=200, blank=True)
    logo = models.ImageField("логотип", upload_to="site/", blank=True)
    og_image = models.ImageField(
        "зображення для соцмереж",
        upload_to="site/",
        blank=True,
        help_text="Прев'ю посилання в месенджерах і соцмережах, 1200×630",
    )

    class Meta:
        verbose_name = "налаштування сайту"
        verbose_name_plural = "налаштування сайту"

    def __str__(self) -> str:
        return self.name


class Service(OrderedModel):
    """A line of work: a card on the home page and its own page, written for one search query."""

    title = models.CharField("назва", max_length=120)
    slug = models.SlugField(
        "адреса сторінки",
        max_length=60,
        unique=True,
        help_text="Латиницею, напр. «landing-page» → /services/landing-page/",
    )
    headline = models.CharField(
        "заголовок сторінки",
        max_length=120,
        blank=True,
        help_text="H1 під пошуковий запит, напр. «Створення лендінгу». Порожнє — назва",
    )
    seo_title = models.CharField("заголовок для пошуку", max_length=70, blank=True, help_text="До ~60 символів")
    seo_description = models.CharField(
        "опис для пошуку", max_length=170, blank=True, help_text="До ~155 символів. Порожнє — опис"
    )
    intro = models.TextField("вступ сторінки", blank=True, help_text="Перший абзац сторінки. Порожнє — опис")
    details = models.TextField(
        "текст сторінки",
        blank=True,
        help_text="Абзаци розділяйте порожнім рядком. «## » на початку — підзаголовок, «- » — пункт списку",
    )
    description = models.TextField("опис", blank=True)
    deliverables = models.TextField(
        "що входить",
        blank=True,
        help_text="По одному пункту на рядок",
    )
    price_from = models.CharField("ціна від", max_length=40, blank=True, help_text="Напр. «від 15 000 ₴»")
    duration = models.CharField("термін", max_length=40, blank=True, help_text="Напр. «2–3 тижні»")

    class Meta(OrderedModel.Meta):
        verbose_name = "послуга"
        verbose_name_plural = "послуги"

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        return f"/services/{self.slug}/"


class ServiceQuestion(OrderedModel):
    """A question answered on one service's page."""

    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name="questions", verbose_name="послуга")
    question = models.CharField("питання", max_length=200)
    answer = models.TextField("відповідь")

    class Meta(OrderedModel.Meta):
        verbose_name = "питання про послугу"
        verbose_name_plural = "питання про послугу"

    def __str__(self) -> str:
        return self.question


class Project(OrderedModel):
    """Portfolio case. Rendered as a card on the home page and as its own page."""

    title = models.CharField("назва", max_length=120)
    slug = models.SlugField(
        "адреса сторінки",
        max_length=80,
        unique=True,
        help_text="Латиницею, напр. «zerno-coffee» → /cases/zerno-coffee/",
    )
    service = models.ForeignKey(
        Service,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="projects",
        verbose_name="послуга",
        help_text="Кейс показується на сторінці цієї послуги",
    )
    client = models.CharField("клієнт", max_length=120, blank=True)
    category = models.CharField("категорія", max_length=60, blank=True, help_text="Напр. «Лендінг», «Інтернет-магазин»")
    year = models.PositiveSmallIntegerField("рік", null=True, blank=True)
    description = models.TextField(
        "короткий опис", blank=True, help_text="Один-два речення для картки й meta description"
    )
    challenge = models.TextField("задача", blank=True, help_text="З чим прийшов клієнт")
    solution = models.TextField(
        "рішення", blank=True, help_text="Що і як ми зробили. Абзаци розділяйте порожнім рядком"
    )
    result = models.TextField("результат", blank=True)
    stack = models.CharField("технології", max_length=200, blank=True, help_text="Через кому: Django, React, Figma")
    image = models.ImageField("обкладинка", upload_to="projects/", blank=True)
    video = models.FileField(
        "відео-прев'ю",
        upload_to="projects/",
        blank=True,
        validators=[VIDEO_VALIDATOR],
        help_text="Коротке MP4/WebM без звуку; грає при наведенні на картку",
    )
    color = models.CharField(
        "колір кейсу",
        max_length=7,
        blank=True,
        validators=[HEX_COLOR_VALIDATOR],
        help_text="Фон картки без обкладинки, напр. #1F3D2B",
    )
    url = models.URLField("посилання на сайт", blank=True)

    class Meta(OrderedModel.Meta):
        ordering = ["order", "-id"]
        verbose_name = "проєкт"
        verbose_name_plural = "портфоліо"

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        return f"/cases/{self.slug}/"


class ProjectMetric(OrderedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="metrics", verbose_name="проєкт")
    value = models.CharField("значення", max_length=20, help_text="Напр. «+38%», «1.2 с»")
    label = models.CharField("підпис", max_length=120)

    class Meta(OrderedModel.Meta):
        verbose_name = "метрика"
        verbose_name_plural = "метрики результату"

    def __str__(self) -> str:
        return f"{self.value} {self.label}"


class ProjectImage(OrderedModel):
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name="gallery", verbose_name="проєкт")
    image = models.ImageField("зображення", upload_to="projects/gallery/")
    caption = models.CharField("підпис", max_length=200, blank=True)

    class Meta(OrderedModel.Meta):
        verbose_name = "зображення"
        verbose_name_plural = "галерея"

    def __str__(self) -> str:
        return self.caption or self.image.name


class SiteType(OrderedModel):
    """A kind of site the studio builds and who it is for («Які сайти ми створюємо»)."""

    title = models.CharField("назва", max_length=120)
    description = models.TextField("опис", blank=True)
    audience = models.TextField("для кого", help_text="По одному пункту на рядок")
    formats_title = models.CharField(
        "заголовок форматів",
        max_length=120,
        blank=True,
        help_text="Напр. «Для кафе й ресторанів — два формати»",
    )
    formats = models.TextField("формати", blank=True, help_text="По одному пункту на рядок")
    examples = models.ManyToManyField(
        Project,
        blank=True,
        related_name="site_types",
        verbose_name="приклади",
        help_text="Кейси з посиланням на сайт",
    )

    class Meta(OrderedModel.Meta):
        verbose_name = "тип сайту"
        verbose_name_plural = "які сайти створюємо"

    def __str__(self) -> str:
        return self.title


class ProcessStep(OrderedModel):
    title = models.CharField("етап", max_length=80)
    description = models.TextField("опис", blank=True)
    duration = models.CharField("тривалість", max_length=40, blank=True, help_text="Напр. «3–5 днів»")

    class Meta(OrderedModel.Meta):
        verbose_name = "етап роботи"
        verbose_name_plural = "процес роботи"

    def __str__(self) -> str:
        return self.title


class Fact(OrderedModel):
    """A headline number about the studio, e.g. «40+ запущених проєктів»."""

    value = models.CharField("значення", max_length=20)
    label = models.CharField("підпис", max_length=120)

    class Meta(OrderedModel.Meta):
        verbose_name = "факт"
        verbose_name_plural = "цифри"

    def __str__(self) -> str:
        return f"{self.value} {self.label}"


class FaqItem(OrderedModel):
    question = models.CharField("питання", max_length=200)
    answer = models.TextField("відповідь")

    class Meta(OrderedModel.Meta):
        verbose_name = "питання"
        verbose_name_plural = "часті питання"

    def __str__(self) -> str:
        return self.question


class SocialLink(OrderedModel):
    name = models.CharField("назва", max_length=40, help_text="Напр. Instagram, Telegram")
    url = models.URLField("посилання")

    class Meta(OrderedModel.Meta):
        verbose_name = "соцмережа"
        verbose_name_plural = "соцмережі"

    def __str__(self) -> str:
        return self.name


class PublishedPostManager(models.Manager):
    def get_queryset(self):
        return super().get_queryset().filter(is_published=True)


class Post(models.Model):
    """Blog article. Body is plain text with a few markers (see `body` help text)."""

    class Category(models.TextChoices):
        GUIDES = "guides", "Гайди"
        SEO = "seo", "SEO"
        COMPARISON = "comparison", "Порівняння"
        CASES = "cases", "Кейси"
        SPEED = "speed", "Швидкість"
        STUDIO = "studio", "Студія"

    title = models.CharField("заголовок", max_length=160)
    slug = models.SlugField(
        "адреса сторінки",
        max_length=100,
        unique=True,
        help_text="Латиницею, напр. «skilky-koshtuye-sait» → /blog/skilky-koshtuye-sait/",
    )
    excerpt = models.CharField(
        "короткий опис",
        max_length=300,
        help_text="Один-два речення для списку статей і meta description",
    )
    body = models.TextField(
        "текст",
        help_text="Абзаци розділяйте порожнім рядком. «## » на початку — підзаголовок, «- » — пункт списку",
    )
    category = models.CharField(
        "рубрика",
        max_length=20,
        choices=Category.choices,
        default=Category.GUIDES,
        help_text="Фільтр на сторінці блогу",
    )
    cover = models.ImageField(
        "обкладинка",
        upload_to="blog/",
        blank=True,
        help_text="Без обкладинки стаття отримує геометричну заставку в кольорах сайту",
    )
    is_featured = models.BooleanField(
        "головна стаття", default=False, help_text="Показується великою зверху блогу. Без позначки — найновіша"
    )
    author = models.CharField("автор", max_length=80, blank=True)
    author_role = models.CharField("посада автора", max_length=80, blank=True, help_text="Напр. «Засновник bruf»")
    published_at = models.DateTimeField("дата публікації", default=timezone.now)
    updated_at = models.DateTimeField("оновлено", auto_now=True)
    is_published = models.BooleanField("опубліковано", default=True)

    objects = models.Manager()
    published = PublishedPostManager()

    class Meta:
        ordering = ["-published_at", "-id"]
        verbose_name = "стаття"
        verbose_name_plural = "блог"

    def __str__(self) -> str:
        return self.title

    def get_absolute_url(self) -> str:
        return f"/blog/{self.slug}/"


class Subscriber(models.Model):
    """Email left in the blog's newsletter form."""

    email = models.EmailField("email", unique=True)
    created_at = models.DateTimeField("підписався", auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "підписник"
        verbose_name_plural = "підписники розсилки"

    def __str__(self) -> str:
        return self.email


class Message(models.Model):
    """Contact-form submission."""

    class Budget(models.TextChoices):
        SMALL = "lt10", "до 10 000 ₴"
        MEDIUM = "10-20", "10–20 тис. ₴"
        LARGE = "20-30", "20–30 тис. ₴"
        XLARGE = "gt30", "понад 30 тис. ₴"
        UNKNOWN = "unknown", "ще не визначились"

    class ContactMethod(models.TextChoices):
        TELEGRAM = "telegram", "Telegram"
        PHONE = "phone", "телефон"
        EMAIL = "email", "email"

    # Picked from the services list on the form; "Інше" when nothing fits
    # ("Other" on the English site).
    OTHER_PROJECT_TYPE = "Інше"
    OTHER_PROJECT_TYPES = (OTHER_PROJECT_TYPE, "Other")

    name = models.CharField("ім'я", max_length=100)
    project_type = models.CharField("тип сайту", max_length=120, blank=True)
    contact_method = models.CharField("як зв'язатися", max_length=10, choices=ContactMethod.choices, blank=True)
    email = models.EmailField("email", blank=True)
    phone = models.CharField("телефон або Telegram", max_length=40, blank=True)
    budget = models.CharField("бюджет", max_length=10, choices=Budget.choices, blank=True)
    message = models.TextField("повідомлення", blank=True)
    created_at = models.DateTimeField("отримано", auto_now_add=True)
    is_read = models.BooleanField("прочитано", default=False)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "заявка"
        verbose_name_plural = "заявки"

    def __str__(self) -> str:
        return f"{self.name} <{self.email or self.phone}>"


# --- English version ---------------------------------------------------------------
#
# The Ukrainian fields above are the source; every translatable one gets an
# optional `<name>_en` twin. An empty twin falls back to the Ukrainian text on
# the English site (see `translated()`), except for posts: an article appears
# on /en/blog/ only once its English title and body are filled in.

TRANSLATED_FIELDS: dict[type[models.Model], tuple[str, ...]] = {
    SiteSettings: ("tagline", "seo_title", "seo_description", "description", "availability", "address"),
    Service: (
        "title",
        "headline",
        "seo_title",
        "seo_description",
        "intro",
        "details",
        "description",
        "deliverables",
        "price_from",
        "duration",
    ),
    ServiceQuestion: ("question", "answer"),
    Project: ("title", "client", "category", "description", "challenge", "solution", "result"),
    ProjectMetric: ("value", "label"),
    ProjectImage: ("caption",),
    SiteType: ("title", "description", "audience", "formats_title", "formats"),
    ProcessStep: ("title", "description", "duration"),
    Fact: ("value", "label"),
    FaqItem: ("question", "answer"),
    Post: ("title", "excerpt", "body", "author_role"),
}

LANGUAGES = ("uk", "en")
DEFAULT_LANGUAGE = "uk"


def english_name(name: str) -> str:
    return f"{name}_en"


def add_english_fields() -> None:
    for model, names in TRANSLATED_FIELDS.items():
        for name in names:
            source = model._meta.get_field(name)
            twin = source.clone()
            twin.blank = True
            twin.default = ""
            twin.verbose_name = f"{source.verbose_name} (EN)"
            twin.help_text = ""
            model.add_to_class(english_name(name), twin)


add_english_fields()


def translated(instance: models.Model, name: str, lang: str) -> str:
    """The field's text in `lang`, falling back to Ukrainian when there is no translation."""
    if lang != DEFAULT_LANGUAGE:
        value = getattr(instance, english_name(name), "")
        if value:
            return value
    return getattr(instance, name)


def has_english(post: Post) -> bool:
    return bool(post.title_en and post.body_en)
