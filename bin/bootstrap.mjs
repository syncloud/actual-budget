import { readFileSync } from 'node:fs'

const base = 'http://127.0.0.1:5006'
const payloadPath = process.env.ACTUAL_BOOTSTRAP_PATH

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function needsBootstrap () {
  try {
    const r = await fetch(`${base}/account/needs-bootstrap`)
    if (!r.ok) return null
    const j = await r.json()
    return j?.data?.bootstrapped === false
  } catch {
    return null
  }
}

async function main () {
  if (!payloadPath) {
    console.log('actual bootstrap: ACTUAL_BOOTSTRAP_PATH not set, skipping')
    return
  }

  let ready = false
  for (let i = 0; i < 150; i++) {
    const nb = await needsBootstrap()
    if (nb === true) { ready = true; break }
    if (nb === false) { console.log('actual bootstrap: already bootstrapped'); return }
    await sleep(2000)
  }
  if (!ready) { console.log('actual bootstrap: server not ready, giving up'); return }

  const body = readFileSync(payloadPath, 'utf8')
  for (let i = 0; i < 60; i++) {
    try {
      const r = await fetch(`${base}/account/bootstrap`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body
      })
      const j = await r.json().catch(() => ({}))
      if (r.ok) { console.log('actual bootstrap: openid enabled'); return }
      if (j?.reason === 'already-bootstrapped') { console.log('actual bootstrap: already bootstrapped'); return }
      console.log(`actual bootstrap: failed (${r.status} ${JSON.stringify(j)}), retrying`)
    } catch (e) {
      console.log(`actual bootstrap: error (${String(e)}), retrying`)
    }
    await sleep(3000)
  }
  console.log('actual bootstrap: exhausted retries')
}

main()
