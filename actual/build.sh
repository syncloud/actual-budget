#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd ${DIR}

APP_OUT=${DIR}/../build/snap/actual
NODE_OUT=${DIR}/../build/snap/node/bin
rm -rf ${APP_OUT} ${NODE_OUT}
mkdir -p ${APP_OUT} ${NODE_OUT}

cp -r /app/. ${APP_OUT}
cp /usr/local/bin/node ${NODE_OUT}/node

${NODE_OUT}/node --version
ls -la ${APP_OUT}
du -sh ${APP_OUT}
