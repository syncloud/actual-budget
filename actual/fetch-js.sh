#!/bin/sh -ex

DIR=$( cd "$( dirname "$0" )" && pwd )
BUILD=$1
URL=http://${ARTIFACT_HOST}:8081/files/actual-budget/${BUILD}-shared/actual-js.tar.gz
OUT=${DIR}/../build/actual-js

rm -rf ${OUT}
mkdir -p ${OUT}
for attempt in 1 2 3 4 5; do
  if wget -q ${URL} -O ${OUT}.tar.gz; then
    break
  fi
  if [ $attempt -eq 5 ]; then
    exit 1
  fi
  sleep 10
done
tar xzf ${OUT}.tar.gz -C ${OUT}
rm ${OUT}.tar.gz
ls ${OUT}
