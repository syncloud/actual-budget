#!/bin/bash -e

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )

export ACTUAL_CONFIG_PATH=/var/snap/actual-budget/current/config.json
export ACTUAL_BOOTSTRAP_PATH=/var/snap/actual-budget/current/bootstrap.json
export NODE_ENV=production

# The server talks to the platform's Authelia over its public https URL for OIDC
# discovery and token exchange. On Syncloud the platform terminates TLS with its
# own certs, which Node's bundled CA store does not trust. TODO: replace with
# NODE_EXTRA_CA_CERTS / --use-system-ca pointing at the platform CA.
export NODE_TLS_REJECT_UNAUTHORIZED=0

cd ${DIR}/actual

${DIR}/node/bin/node ${DIR}/bin/bootstrap.mjs &

exec ${DIR}/node/bin/node ${DIR}/actual/app.js
