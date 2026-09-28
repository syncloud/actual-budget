import { Page, TestInfo } from '@playwright/test'

async function shootStep (page: Page, info: TestInfo | undefined, name: string) {
  if (info) await page.screenshot({ path: info.outputPath(name) })
}

export async function loginViaAuthelia (
  page: Page,
  baseURL: string,
  username: string,
  password: string,
  info?: TestInfo
) {
  await page.goto(baseURL)
  await page.getByRole('button', { name: /(Start using|Sign in with) OpenID/ }).click()
  await shootStep(page, info, 'login-provider.png')

  await page.getByPlaceholder('Username').fill(username)
  await page.getByPlaceholder('Password').fill(password)
  await page.getByRole('button', { name: 'Sign in' }).click()

  await page.getByText(/logged in as/i).waitFor({ state: 'visible', timeout: 30_000 })
  await shootStep(page, info, 'login-done.png')
}
