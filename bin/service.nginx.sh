#!/bin/bash -e

DIR=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && cd .. && pwd )

/bin/rm -f /var/snap/actual-budget/common/web.socket
exec ${DIR}/nginx/bin/nginx.sh -c ${DIR}/config/nginx.conf -p ${DIR}/nginx -e stderr
