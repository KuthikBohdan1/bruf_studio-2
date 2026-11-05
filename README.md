# bruf — сайт веб-студії

База для сайту студії: Django + DRF зберігає весь контент і редагується через
адмінку, Vite + React SPA його показує. Обидві частини працюють з одного домену,
тож у продакшені немає CORS, а браузер робить один API-запит при завантаженні.

Що вже є:

- головна: **Hero (з фоновим відео) → цифри → Послуги → Кейси → Ціни → Процес → Блог → Питання → Контакти**;
- окрема сторінка для кожного кейсу (`/cases/<slug>/`): задача → рішення → результат,
  метрики, стек, галерея, відео-прев'ю;
- форма заявки з вибором бюджету, акцент на Telegram та Instagram;
- адмінка для всього контенту (налаштування, послуги, кейси з метриками й галереєю,
  процес, цифри, FAQ, соцмережі, заявки);
- серверний SEO: title, description, Open Graph і schema.org (`Organization`,
  `FAQPage`, `CreativeWork` для кейсів) з бази ще до виконання JS, плюс `robots.txt`
  і `sitemap.xml` з усіма кейсами;
- світла/темна тема, адаптивна верстка;
- Docker (Postgres + gunicorn) і продакшен-оверлей з Caddy та автоматичним HTTPS.

## API

| Метод  | Шлях            | Призначення                                                 |
| ------ | --------------- | ----------------------------------------------------------- |
| `GET`  | `/api/site/`    | Увесь контент сайту одним запитом, кешується до змін у базі |
| `POST` | `/api/message/` | Заявка з контактної форми (з rate limit)                    |

## Локальний запуск

```bash
cp .env.example .env      # відредагуйте секрети
docker compose up -d --build
```

Сайт відкривається на <http://127.0.0.1:8008>, адмінка — на `/admin/`. Під час
першого старту застосовуються міграції, завантажується демо-контент і
створюється адмін (див. нижче).

Фронтенд зручніше розробляти через Vite dev server — він проксує `/api` і
`/media` у контейнер:

```bash
cd front && npm install && npm run dev    # http://localhost:5173
```

### Без Docker

Якщо в `.env` не задані `POSTGRES_DB`/`POSTGRES_USER`, Django бере SQLite:

```bash
cd front && npm install && npm run build   # збірка в django/frontend_dist/
cd ../django
python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
DEBUG=True .venv/bin/python manage.py migrate
DEBUG=True .venv/bin/python manage.py seed_demo
DEBUG=True .venv/bin/python manage.py runserver
```

### Лінтери

```bash
cd django && .venv/bin/ruff check . && .venv/bin/ruff format --check .   # pip install -r requirements-dev.txt
npm --prefix front run lint
npm --prefix front run typecheck
```

Проти Postgres зі стеку compose: `POSTGRES_HOST=127.0.0.1 POSTGRES_PORT=5438`
перед командою — `db` з `.env` резолвиться лише всередині мережі compose.

## Контент і адмін

`manage.py seed_demo` робить дві незалежні ідемпотентні речі: завантажує
демо-контент (пропускається, якщо в базі вже є контент; `--force` перезаписує) і
створює суперкористувача, якщо такого логіна ще немає. Запускається автоматично
при старті контейнера (`docker/entrypoint.sh`).

Логін і пароль беруться з `DJANGO_SUPERUSER_USERNAME` / `_PASSWORD` / `_EMAIL`.
Якщо пароль порожній, генерується випадковий і один раз друкується в лог старту
(`docker compose logs web`). Наявний акаунт ніколи не змінюється.

## Як додати нову секцію

Наприклад, «Відгуки»:

1. **Модель** у `django/main/models.py` → `manage.py makemigrations`.
2. **Адмінка** — `@admin.register(...)` у `main/admin.py`.
3. **API** — серіалізатор у `main/serializers.py`, поле в `SiteSerializer` і
   queryset у `build_site_payload()` (`main/views.py`).
4. **Кеш** — додайте модель у `CONTENT_MODELS` (`main/signals.py`), інакше зміни
   в адмінці не з'являться на сайті до закінчення `CACHE_TIMEOUT`.
5. **Типи** — інтерфейс і поле в `SiteData` у `front/src/lib/api.ts`.
6. **Компонент** у `front/src/components/home/` на основі `ui/Section`, потім
   додайте його в `pages/HomePage.tsx` і пункт меню в `homeNavItems()` у
   `App.tsx` (в тому ж порядку).

## Структура

- `django/` — Django 5.2 + DRF. `main/` містить моделі, два API-view, `seo.py`
  (SPA-оболонка, robots.txt, sitemap.xml) і демо-фікстуру.
- `front/` — Vite + React 18 + Tailwind v4. `npm run build` пише в
  `django/frontend_dist/`, яку Django використовує і як каталог шаблонів, і як
  статику. Кольори теми — CSS-змінні в `src/styles.css`, примітиви — `src/components/ui/`.
- `Dockerfile` — multi-stage: збирає фронтенд у Node, потім копіює результат у
  Python-образ.

### SEO для SPA

Django рендерить зібраний `index.html` як шаблон і підставляє метатеги з бази,
тому пошуковики бачать реальний контент без виконання JS.

**Django парсить цей файл як шаблон, включно з HTML-коментарями.** Коментар, що
містить `{{ ... }}` або `{% ... %}`, — синтаксична помилка шаблону, яка кладе
всю сторінку з 500. У `front/index.html` є відповідне попередження.

## CI/CD

`.github/workflows/ci.yml` на кожен push і pull request запускає:

- **Backend:** Ruff (lint і формат), перевірку, що міграції відповідають моделям, і
  Django-тести на PostgreSQL;
- **Frontend:** ESLint, перевірку типів і збірку SPA;
- **Docker:** збірку образу.

Гілки: розробка в `dev`, далі fast-forward у `main` → `stable` → `prod`. Push у
`prod` після зеленого CI деплоїть сайт: Actions заходить на сервер по SSH, і там
запускається `scripts/deploy.sh` (`git fetch` → `reset` на `origin/prod` →
`docker compose up -d --build` → очікування healthcheck).

SSH-ключ CI прив'язаний на сервері до цього скрипта:

```
command="/opt/bruf/scripts/deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 AAAA… github-actions
```

тож навіть із цим ключем можна лише передеплоїти `prod`. Сервер тягне код
окремим read-only deploy key. Секрети середовища `production` у GitHub:
`VPS_HOST`, `VPS_USER`, `VPS_SSH_KEY`, `VPS_KNOWN_HOSTS` (`ssh-keyscan <host>`).

## Деплой

Продакшен додає `compose.prod.yaml`: Caddy на портах 80/443 перед gunicorn.
Caddy сам отримує і продовжує сертифікат Let's Encrypt.

```bash
docker compose -f compose.yaml -f compose.prod.yaml up -d --build
```

На сервері зручно прописати `COMPOSE_FILE=compose.yaml:compose.prod.yaml` у
`.env` — тоді звичайний `docker compose ...` уже включає оверлей.

Назовні слухає тільки Caddy: `compose.yaml` публікує `web` і `db` лише на
`127.0.0.1`. До продакшен-бази підключайтесь через SSH-тунель
(`ssh -L 5438:127.0.0.1:5438 <server>`), а не розширюючи binding.

`SITE_ADDRESS` разом зі схемою визначає режим Caddy:

- `example.com` — автоматичний HTTPS, `:80` редіректить на `:443`;
- `http://example.com` — чистий HTTP без ACME. Корисно при першому деплої:
  перевіряє, що порт 80 доступний, і не витрачає ліміт невдалих валідацій
  Let's Encrypt.

Том `caddy_data` зберігає сертифікат і ACME-ключ — не видаляйте його.

### Спільний сервер з уже наявним Caddy

Якщо порти 80/443 на сервері вже тримає інший Caddy (підключений до зовнішньої
мережі `edge`), власний Caddy не запускається. Замість `compose.prod.yaml`
використовуйте `compose.edge.yaml` — `web` приєднується до `edge` як `bruf-web`:

```bash
# .env на сервері
COMPOSE_PROJECT_NAME=bruf
COMPOSE_FILE=compose.yaml:compose.edge.yaml
WEB_PORT=8012            # вільний порт на 127.0.0.1 для перевірок з сервера
```

і в Caddyfile того сервера:

```
bruf.pro {
	reverse_proxy bruf-web:8000
}
```

### Змінні оточення для продакшену

| Змінна                                 | Значення                                     |
| -------------------------------------- | -------------------------------------------- |
| `SITE_ADDRESS`                         | `example.com`                                |
| `ACME_EMAIL`                           | адреса для попереджень про сертифікат        |
| `ALLOWED_HOSTS`                        | `example.com,127.0.0.1`                      |
| `SITE_URL`, `CSRF_TRUSTED_ORIGINS`     | `https://example.com`                        |
| `COOKIE_SECURE`, `SECURE_SSL_REDIRECT` | `True`                                       |
| `SECURE_HSTS_SECONDS`                  | `31536000` (лише після перевірки HTTPS)      |

`127.0.0.1` має лишатися в `ALLOWED_HOSTS`: healthcheck контейнера звертається
до gunicorn напряму із заголовком `X-Forwarded-Proto: https`.

Вмикайте HSTS тільки коли сертифікат точно працює — браузери кешують заголовок
на весь термін. `SECURE_HSTS_PRELOAD` навмисно вимкнений.
`manage.py check --deploy` має показувати лише попередження про preload.
