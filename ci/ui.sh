#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )

PROJECT="${1:-desktop}"
NAME=actual-budget
export PLAYWRIGHT_DOMAIN="${PLAYWRIGHT_DOMAIN:-bookworm.com}"
export PLAYWRIGHT_USER="${PLAYWRIGHT_USER:-user}"
export PLAYWRIGHT_PASSWORD="${PLAYWRIGHT_PASSWORD:-Password1}"

DOMAIN="$PLAYWRIGHT_DOMAIN"
APP_DOMAIN="${NAME}.${DOMAIN}"
getent hosts $APP_DOMAIN | sed "s/$APP_DOMAIN/auth.$DOMAIN/g" | tee -a /etc/hosts
cat /etc/hosts

cd ${DIR}/web/e2e
npm ci
set +e
npx playwright test --project="${PROJECT}"
EXIT=$?
set -e

ART=${DIR}/artifact
SHOTS=${ART}/screenshots-${PROJECT}
VIDEOS=${ART}/videos-${PROJECT}
mkdir -p ${SHOTS} ${VIDEOS}

DEVICE="actual-budget.${PLAYWRIGHT_DOMAIN:-bookworm.com}"
apt-get update -qq >/dev/null 2>&1 && apt-get install -y -qq sshpass openssh-client >/dev/null 2>&1 || true
sshpass -p "${PLAYWRIGHT_PASSWORD:-Password1}" ssh \
    -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null -o ConnectTimeout=10 \
    root@${DEVICE} "journalctl -u snap.actual-budget.actual --no-pager | tail -500" \
    > ${ART}/actual.${PROJECT}.journal.log 2>&1 || true

if [ -d test-results ]; then
    for d in test-results/*/; do
        name=$(basename "$d")
        i=0
        for img in "$d"*.png; do
            [ -f "$img" ] || continue
            suffix=$([ $i -eq 0 ] && echo "" || echo "-$i")
            cp "$img" "${SHOTS}/${name}${suffix}.png"
            i=$((i+1))
        done
        [ -f "${d}video.webm" ] && cp "${d}video.webm" "${VIDEOS}/${name}.webm"
    done
fi

exit ${EXIT}
