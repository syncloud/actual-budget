#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
REPO=$1
BRANCH=$2
UPSTREAM_TAG=$3
SRC=${DIR}/../build/actual-src
OUT=${DIR}/../artifact/shared

rm -rf ${SRC} ${OUT}
mkdir -p ${SRC} ${OUT}
cd ${SRC}

git init -q
git remote add origin ${REPO}
git fetch -q --depth 1 origin ${BRANCH}
git checkout -q FETCH_HEAD
git rev-parse HEAD
git fetch -q --depth 1 https://github.com/actualbudget/actual.git tag ${UPSTREAM_TAG}
git diff --exit-code ${UPSTREAM_TAG} HEAD -- yarn.lock

corepack enable
yarn install --immutable
NODE_OPTIONS=--max_old_space_size=4096 yarn build:server

tar czf ${OUT}/actual-js.tar.gz \
  --transform 's,^packages/sync-server/build,server,;s,^packages/desktop-client/build,web,;s,^packages/sync-server/package.json,server-package.json,' \
  packages/sync-server/build packages/sync-server/package.json packages/desktop-client/build
ls -lh ${OUT}
