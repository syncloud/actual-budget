# Actual Budget — Syncloud app

Packages [Actual Budget](https://actualbudget.org/) (the self-hosted
`actualbudget/actual-server`) as a Syncloud app. The server both serves the web
UI and stores all budget data; there is no separate "sync-only" component.

## Shape

- `actual/` — vendors `/app` and the `node` binary out of the official
  `actualbudget/actual-server:<version>` Docker image (Debian/glibc, Node 22).
- `cli/` — Go + Cobra install/configure/refresh hooks. `configure` registers an
  OIDC client with the platform (Authelia) and writes `config.json` for
  actual-server with `loginMethod: openid`.
- `nginx/` + `config/nginx.conf` — reverse proxy on the platform `web.socket`
  to actual-server on `127.0.0.1:5006`.
- `web/e2e/` — Playwright tests: log in through Authelia, create a budget, add
  an account and a transaction, and screenshot each step.
- `test/` — pytest integration test (install on a device, assert it serves).
- `.drone.jsonnet` — CI, publishing via the `syncloud/store-publisher` image.

## Upstream version

Pinned in `.drone.jsonnet` as `local version = '...'` (the
`actualbudget/actual-server` Docker tag).

## OIDC bootstrap

actual-server only switches into OpenID mode once the instance is *bootstrapped*
(its `auth` table has an active `openid` row). Config alone leaves it on the
password-setup screen. So `configure` writes `bootstrap.json` (the openId
client), and `bin/bootstrap.mjs` — forked by `service.actual.sh` — waits for the
server then POSTs `/account/bootstrap`. The first OIDC login becomes the owner.

## OIDC token exchange (Authelia / RFC 9207)

Authelia advertises `authorization_response_iss_parameter_supported`, so
openid-client's `client.callback()` demands the `iss` response param, which
actual-server does not forward (`RPError: iss missing from the response`). The
stored config therefore uses `authMethod: "oauth2"`, which makes actual-server
take its `client.grant()` path (plain auth-code exchange, still with PKCE) and
skip that check. The OIDC flow (discover → authorize → grant → userinfo) then
completes and the first OIDC user becomes the owner.

## Known follow-ups (initial WIP)

- `NODE_TLS_REJECT_UNAUTHORIZED=0` is set so the server can reach the platform
  Authelia over its untrusted-by-Node cert for OIDC discovery/token exchange.
  **Replace with `NODE_EXTRA_CA_CERTS` / `--use-system-ca` pointing at the
  platform CA before any real release.**
- actual-server listens on TCP `127.0.0.1:5006`; it does not bind a Unix socket,
  so nginx proxies to localhost rather than a socket.
- The e2e adds an account with a starting balance (validated); adding a manual
  transaction is currently best-effort and not asserted.
- amd64 only for now; arm64 is a follow-up.

## Build

    ./package.sh actual-budget <build-number>

## Install on a device

    snap install --devmode ./actual-budget_<ver>_<arch>.snap
