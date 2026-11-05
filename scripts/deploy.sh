#!/bin/sh
# Deploy the latest `prod` on this server.
#
# GitHub Actions runs this over SSH (.github/workflows/ci.yml). Its key is
# pinned to this script in ~/.ssh/authorized_keys:
#   command="/opt/bruf/scripts/deploy.sh",no-pty,no-port-forwarding,no-agent-forwarding,no-X11-forwarding ssh-ed25519 …
# so a leaked CI key can redeploy prod and nothing else. It can also be run by hand.
#
# Everything lives inside main(): `git reset` below rewrites this very file, and
# sh reads scripts as it goes, but a function body is parsed before it runs.

set -eu

BRANCH=prod
HEALTH_TIMEOUT_S=180

main() {
	cd "$(dirname "$0")/.."

	# One deploy at a time, even if two pushes land close together.
	exec 9>/tmp/bruf-deploy.lock
	flock -n 9 || { echo "Another deploy is running" >&2; exit 1; }

	echo "→ Fetching $BRANCH"
	git fetch --quiet origin "$BRANCH"
	git reset --quiet --hard "origin/$BRANCH"
	echo "  at $(git log -1 --format='%h %s')"

	echo "→ Rebuilding containers"
	docker compose up -d --build --remove-orphans

	echo "→ Waiting for the web healthcheck"
	container=$(docker compose ps -q web)
	waited=0
	until [ "$(docker inspect -f '{{.State.Health.Status}}' "$container")" = healthy ]; do
		if [ "$waited" -ge "$HEALTH_TIMEOUT_S" ]; then
			echo "web is not healthy after ${HEALTH_TIMEOUT_S}s" >&2
			docker compose logs --tail 80 web >&2
			exit 1
		fi
		sleep 5
		waited=$((waited + 5))
	done

	# Each build leaves the previous image untagged; drop only this project's.
	docker image prune -f --filter "label=com.docker.compose.project=bruf" >/dev/null

	echo "✓ Deployed $(git rev-parse --short HEAD)"
}

main "$@"
