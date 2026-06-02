#!/bin/bash -e

export ACTUAL_CONFIG_PATH=${SNAP_DATA}/config/config.json
export NODE_ENV=production
export NODE_EXTRA_CA_CERTS=/var/snap/platform/current/syncloud.ca.crt

/bin/rm -f ${SNAP_DATA}/actual.sock

cd ${SNAP}/actual
exec ${SNAP}/node/node.sh ${SNAP}/actual/app.js
