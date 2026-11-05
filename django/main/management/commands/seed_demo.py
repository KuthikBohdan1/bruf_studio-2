"""Load the demo content fixture and ensure an admin account exists.

Runs automatically on container start (see docker/entrypoint.sh). Both halves are
idempotent: content is skipped once real rows exist, and the superuser is only
created when the username is free — restarting the stack never overwrites data
or resets a password you changed by hand.
"""

import os
import secrets
from pathlib import Path

from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.core.files import File
from django.core.files.storage import default_storage
from django.core.management import call_command
from django.core.management.base import BaseCommand

from main.signals import CONTENT_MODELS

FIXTURE = "demo_data"

# Files the fixture's image fields point at, laid out as they are under MEDIA_ROOT.
DEMO_MEDIA = Path(__file__).resolve().parents[2] / "fixtures" / "demo_media"

DEFAULT_USERNAME = "admin"
DEFAULT_EMAIL = "admin@example.com"


class Command(BaseCommand):
    help = "Populate the database with demo studio content and an admin user (idempotent)."

    def add_arguments(self, parser) -> None:
        parser.add_argument(
            "--force",
            action="store_true",
            help="Re-apply the fixture even if content already exists (overwrites rows by id).",
        )
        parser.add_argument(
            "--skip-superuser",
            action="store_true",
            help="Only seed content, leave the auth tables untouched.",
        )

    def handle(self, *args, **options) -> None:
        self.verbosity = options["verbosity"]
        self.seed_content(force=options["force"])

        if not options["skip_superuser"]:
            self.ensure_superuser()

    def seed_content(self, *, force: bool) -> None:
        if any(model.objects.exists() for model in CONTENT_MODELS) and not force:
            self.say("Content already present — skipping demo seed (use --force to override).")
            return

        call_command("loaddata", FIXTURE, verbosity=0)
        self.copy_demo_media()
        cache.clear()

        counts = ", ".join(f"{model.objects.count()} {model._meta.verbose_name_plural}" for model in CONTENT_MODELS)
        self.say(self.style.SUCCESS(f"Seeded demo content: {counts}."))

    def copy_demo_media(self) -> None:
        """Put the fixture's images into media storage, never overwriting an upload."""
        for source in DEMO_MEDIA.rglob("*"):
            name = source.relative_to(DEMO_MEDIA).as_posix()
            if source.is_file() and not default_storage.exists(name):
                with source.open("rb") as handle:
                    default_storage.save(name, File(handle))

    def ensure_superuser(self) -> None:
        username = os.getenv("DJANGO_SUPERUSER_USERNAME", DEFAULT_USERNAME)
        email = os.getenv("DJANGO_SUPERUSER_EMAIL", DEFAULT_EMAIL)
        password = os.getenv("DJANGO_SUPERUSER_PASSWORD")

        User = get_user_model()

        if User.objects.filter(username=username).exists():
            self.say(f"Superuser '{username}' already exists — leaving it as is.")
            return

        # No password configured: mint a random one rather than fall back to
        # something guessable. It is printed once here and nowhere else.
        generated = not password
        if generated:
            password = secrets.token_urlsafe(18)

        User.objects.create_superuser(username=username, email=email, password=password)

        if generated:
            # Printed regardless of verbosity: this is the only copy.
            self.stdout.write(
                self.style.WARNING(
                    f"DJANGO_SUPERUSER_PASSWORD is not set. Created superuser '{username}' "
                    f"with a generated password: {password}\n"
                    "Save it now — it is not stored anywhere else."
                )
            )
        else:
            self.say(self.style.SUCCESS(f"Created superuser '{username}'."))

    def say(self, message: str) -> None:
        if self.verbosity > 0:
            self.stdout.write(message)
