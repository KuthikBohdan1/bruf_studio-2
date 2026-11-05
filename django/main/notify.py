"""Tell the studio about a new lead from the contact form, as a Telegram message.

Leads otherwise wait in the admin until someone happens to look. The bot only
sends: set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID, or this does nothing.
Delivery runs on a background thread and a failure is only logged: a visitor's
form must not depend on Telegram.
"""

import json
import logging
import threading
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from django.conf import settings

from main.models import Message

logger = logging.getLogger(__name__)

SEND_TIMEOUT_SECONDS = 8
SEND_ATTEMPTS = 2
RETRY_DELAY_SECONDS = 1


def lead_text(message: Message) -> str:
    contact = message.phone if message.contact_method in ("telegram", "phone") else message.email
    lines = [
        "🔔 Нова заявка з сайту",
        f"Ім'я: {message.name}",
        f"Контакт ({message.get_contact_method_display() or 'email'}): {contact}",
    ]
    if message.project_type:
        lines.append(f"Що потрібно: {message.project_type}")
    if message.budget:
        lines.append(f"Бюджет: {message.get_budget_display()}")
    if message.message:
        lines.append(f"\n{message.message}")
    lines.append(f"\n{settings.SITE_URL}/admin/main/message/{message.pk}/change/")
    return "\n".join(lines)


def send_to_telegram(token: str, chat_id: str, text: str) -> bool:
    payload = {"chat_id": chat_id, "text": text, "disable_web_page_preview": True}
    request = Request(
        f"https://api.telegram.org/bot{token}/sendMessage",
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
    )
    for attempt in range(SEND_ATTEMPTS):
        try:
            with urlopen(request, timeout=SEND_TIMEOUT_SECONDS):
                return True
        except HTTPError as error:
            # Telegram read the request and said no; asking again will not change that.
            # Never log the URL: it holds the bot token.
            logger.error("Telegram refused a lead: HTTP %s", error.code)
            return False
        except (URLError, TimeoutError, OSError) as error:
            logger.warning("Sending a lead to Telegram, attempt %s failed: %s", attempt + 1, type(error).__name__)
            if attempt + 1 < SEND_ATTEMPTS:
                time.sleep(RETRY_DELAY_SECONDS)
    return False


def notify_new_lead(message: Message) -> threading.Thread | None:
    token, chat_id = settings.TELEGRAM_BOT_TOKEN, settings.TELEGRAM_CHAT_ID
    if not token or not chat_id:
        return None
    thread = threading.Thread(target=send_to_telegram, args=(token, chat_id, lead_text(message)), daemon=True)
    thread.start()
    return thread
