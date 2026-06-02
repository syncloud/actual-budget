#!/bin/bash -ex

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
cd ${DIR}

NODE_DIR=${DIR}/../build/snap/node
APP_OUT=${DIR}/../build/snap/actual
NODE_OUT=${NODE_DIR}/bin
NODE_LIB_OUT=${NODE_DIR}/lib
rm -rf ${APP_OUT} ${NODE_DIR}
mkdir -p ${APP_OUT} ${NODE_OUT} ${NODE_LIB_OUT}

cp -r /app/. ${APP_OUT}
cp /usr/local/bin/node ${NODE_OUT}/node

# Bundle the full shared-library closure of node and every native (.node) module,
# plus the dynamic loader, so the snap has no dependency on the host OS libs (only
# the kernel ABI). node is then launched through the bundled loader (see node.sh),
# mirroring nginx/bin/nginx.sh.
NATIVE=$(find ${APP_OUT} -name '*.node' 2>/dev/null || true)
for f in ${NODE_OUT}/node ${NATIVE}; do
  ldd "$f" 2>/dev/null | awk '/=> \// {print $3} /^\s*\/.*ld-linux/ {print $1}'
done | sort -u | while read -r lib; do
  [ -n "$lib" ] && [ -e "$lib" ] && cp -Lv "$lib" ${NODE_LIB_OUT}/ || true
done

for loader in /lib/ld-linux*.so* /lib64/ld-linux*.so* /lib/*-linux-gnu*/ld-linux*.so* /lib/*-linux-gnu*/ld-*.so*; do
  [ -e "$loader" ] && cp -Lv "$loader" ${NODE_LIB_OUT}/ || true
done

cat > ${NODE_DIR}/node.sh <<'EOF'
#!/bin/bash
NDIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )
LOADER=$(ls ${NDIR}/lib/ld-linux*.so* ${NDIR}/lib/ld-*.so* 2>/dev/null | head -1)
exec "${LOADER}" --library-path "${NDIR}/lib" "${NDIR}/bin/node" "$@"
EOF
chmod +x ${NODE_DIR}/node.sh

ls -la ${NODE_LIB_OUT}
${NODE_DIR}/node.sh --version
du -sh ${APP_OUT} ${NODE_DIR}
