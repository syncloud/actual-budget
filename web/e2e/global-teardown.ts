import { ssh } from './helpers/ssh'
import * as fs from 'node:fs'
import * as path from 'node:path'

const artifactRoot = process.env.PLAYWRIGHT_ARTIFACT_DIR ?? 'artifact'
const project = process.env.PLAYWRIGHT_PROJECT ?? 'desktop'

export default async function globalTeardown () {
  fs.mkdirSync(artifactRoot, { recursive: true })
  const journal = ssh('journalctl -u snap.actual-budget.actual --no-pager | tail -800', { throw: false })
  fs.writeFileSync(path.join(artifactRoot, `actual.${project}.journal.log`), journal)
}
