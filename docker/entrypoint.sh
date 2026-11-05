#!/bin/sh
# Prepare the database, then hand over to the process in CMD.
set -e

echo "→ Applying migrations"
python manage.py migrate --no-input

echo "→ Seeding demo content and admin user (both skipped when already present)"
python manage.py seed_demo

echo "→ Starting: $*"
exec "$@"
