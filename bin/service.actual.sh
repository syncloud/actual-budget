#!/bin/bash -e

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )

export ACTUAL_CONFIG_PATH=/var/snap/actual-budget/current/config.json
export NODE_ENV=production

cd ${DIR}/actual
exec ${DIR}/node/bin/node ${DIR}/actual/app.js
