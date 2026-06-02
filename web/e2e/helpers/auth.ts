import { Page } from '@playwright/test'

export async function loginViaAuthelia (
  page: Page,
  baseURL: string,
  username: string,
  password: string
) {
  await page.goto(baseURL)

  const signIn = page.getByRole('button', { name: /sign in/i }).first()
  try {
    await signIn.waitFor({ state: 'visible', timeout: 15_000 })
    await Promise.all([
      page.waitForURL((url) => new URL(url.toString()).host.startsWith('auth.'), { timeout: 30_000 }).catch(() => {}),
      signIn.click()
    ])
  } catch (_) {
  }

  try {
    await page.waitForURL((url) => new URL(url.toString()).host.startsWith('auth.'), { timeout: 15_000 })
  } catch (_) {
  }

  const usernameSelectors = [
    'input[name="username"]',
    'input#username-textfield',
    'input[autocomplete="username"]',
    'input[type="text"]'
  ]
  const passwordSelectors = [
    'input[name="password"]',
    'input#password-textfield',
    'input[autocomplete="current-password"]',
    'input[type="password"]'
  ]
  const submitSelectors = [
    'button#sign-in-button',
    'button[type="submit"]',
    'button:has-text("Sign in")',
    'button:has-text("Login")'
  ]

  const found = async (selectors: string[]): Promise<string> => {
    for (const sel of selectors) {
      const el = page.locator(sel).first()
      try {
        await el.waitFor({ state: 'visible', timeout: 5_000 })
        return sel
      } catch (_) {}
    }
    const url = page.url()
    const title = await page.title().catch(() => '?')
    throw new Error(`no selector matched on ${url} (title="${title}"): ${selectors.join(', ')}`)
  }

  const onAuthelia = new URL(page.url()).host.startsWith('auth.')
  if (onAuthelia) {
    const userSel = await found(usernameSelectors)
    await page.fill(userSel, username)
    const passSel = await found(passwordSelectors)
    await page.fill(passSel, password)
    const submitSel = await found(submitSelectors)
    await Promise.all([
      page.waitForURL((url) => !new URL(url.toString()).host.startsWith('auth.'), { timeout: 30_000 }),
      page.click(submitSel)
    ])
  }

  await page.waitForLoadState('networkidle').catch(() => {})
  await page.locator('#root, [data-testid="app"]').first().waitFor({ state: 'attached', timeout: 30_000 })
}
