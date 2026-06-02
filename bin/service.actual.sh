#!/bin/bash -e

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )

export ACTUAL_CONFIG_PATH=/var/snap/actual-budget/current/config.json
export NODE_ENV=production
export NODE_EXTRA_CA_CERTS=/var/snap/platform/current/syncloud.ca.crt

cd ${DIR}/actual

exec ${DIR}/node/node.sh ${DIR}/actual/app.js
