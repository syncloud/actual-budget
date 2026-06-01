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

## Known follow-ups (initial WIP)

- actual-server listens on TCP `127.0.0.1:5006`; it does not bind a Unix socket,
  so nginx proxies to localhost rather than a socket.
- OIDC discovery hits the public auth URL; verify on-device resolution and the
  first-user bootstrap flow.
- Playwright budget-flow selectors target Actual 25.2.x and may need tuning.
- amd64 only for now; arm64 is a follow-up.

## Build

    ./package.sh actual-budget <build-number>

## Install on a device

    snap install --devmode ./actual-budget_<ver>_<arch>.snap
