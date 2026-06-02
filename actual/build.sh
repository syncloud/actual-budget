#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd ${DIR}

NODE_DIR=${DIR}/../build/snap/node
APP_OUT=${DIR}/../build/snap/actual
rm -rf ${APP_OUT} ${NODE_DIR}
mkdir -p ${APP_OUT} ${NODE_DIR}

cp -r /app/. ${APP_OUT}

cp -r /usr ${NODE_DIR}/usr
cp -r /lib ${NODE_DIR}/lib

cp ${DIR}/node.sh ${NODE_DIR}/node.sh

${NODE_DIR}/node.sh --version
du -sh ${APP_OUT} ${NODE_DIR}
