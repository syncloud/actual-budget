#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd ${DIR}

NODE_DIR=${DIR}/../build/snap/node
APP_OUT=${DIR}/../build/snap/actual
JS=${DIR}/../build/actual-js
rm -rf ${APP_OUT} ${NODE_DIR}
mkdir -p ${APP_OUT} ${NODE_DIR}

cp -r /app/. ${APP_OUT}

rm -rf ${APP_OUT}/app.js ${APP_OUT}/app.js.map ${APP_OUT}/chunks ${APP_OUT}/bin ${APP_OUT}/scripts
cp -r ${JS}/server/. ${APP_OUT}
cp ${JS}/server-package.json ${APP_OUT}/package.json
rm -rf ${APP_OUT}/node_modules/@actual-app/web/build
cp -r ${JS}/web ${APP_OUT}/node_modules/@actual-app/web/build

cp -r /usr ${NODE_DIR}/usr
cp -r /lib ${NODE_DIR}/lib

cp ${DIR}/node.sh ${NODE_DIR}/node.sh

${NODE_DIR}/node.sh --version
grep -rq /truelayer ${APP_OUT}/app.js ${APP_OUT}/chunks
du -sh ${APP_OUT} ${NODE_DIR}
