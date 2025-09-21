#!/bin/bash
set -e
echo "REPO_URL=${REPO_URL}"
if [ -n "$REPO_URL" ] && git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  git remote set-url origin "$REPO_URL" || true
  git fetch || true
fi

cd /home/osd-dev/OpenSearch-Dashboards || cd /home/osd-dev || pwd
echo "Bootstrapping OpenSearch Dashboards..."
sed -i 's/\r$//' scripts/use_node || true
chmod +x scripts/use_node || true
yarn osd bootstrap --network-timeout 600000 || yarn osd bootstrap --network-timeout 600000
echo "Starting OpenSearch Dashboards dev server..."
exec yarn start:docker
