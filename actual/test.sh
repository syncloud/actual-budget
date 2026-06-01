#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

NODE=${DIR}/../build/snap/node/bin/node
APP=${DIR}/../build/snap/actual

${NODE} --version

cd ${APP}
${NODE} -e "require('better-sqlite3'); require('bcrypt'); console.log('native modules load ok')"
