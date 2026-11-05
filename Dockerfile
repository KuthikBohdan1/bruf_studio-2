# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Stage 1 — build the React SPA. Vite writes to ../django/frontend_dist, which
# resolves to /app/django/frontend_dist inside this stage.
# ---------------------------------------------------------------------------
FROM node:22-alpine AS frontend

WORKDIR /app/front

COPY front/package.json front/package-lock.json ./
RUN npm ci --no-audit --no-fund

COPY front/ ./
# CI typechecks; skipping tsc here keeps the build within a small server's memory.
RUN npx vite build


# ---------------------------------------------------------------------------
# Stage 2 — Django application serving both the API and the built SPA.
# ---------------------------------------------------------------------------
FROM python:3.13-slim AS web

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    # Kept outside /app so a bind-mounted source tree cannot shadow them.
    FRONTEND_DIST=/srv/frontend_dist \
    STATIC_ROOT=/srv/staticfiles \
    MEDIA_ROOT=/srv/media

WORKDIR /app

COPY django/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY django/ ./
COPY --from=frontend /app/django/frontend_dist /srv/frontend_dist
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

# Compress and stage the bundles once, at build time. index.html is a Django
# template (main/seo.py renders it), so its raw copy must not become a static file.
RUN mkdir -p /srv/media && python manage.py collectstatic --no-input --ignore index.html

EXPOSE 8000

ENTRYPOINT ["entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "3", "--threads", "2", "--access-logfile", "-", "--error-logfile", "-"]
