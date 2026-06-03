# Actual Budget — Syncloud app

Packages the self-hosted [Actual Budget](https://actualbudget.org/) server
(`actualbudget/actual-server`) as a Syncloud app.

## Build

    ./package.sh actual-budget <build-number>

## Install on a device

    snap install --devmode ./actual-budget_<version>_<arch>.snap
