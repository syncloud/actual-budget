import { Page, TestInfo, expect } from '@playwright/test'
import { shoot } from './screenshot'

async function clickFirst (page: Page, names: RegExp[]): Promise<boolean> {
  for (const name of names) {
    const byRole = page.getByRole('button', { name }).first()
    if (await byRole.isVisible().catch(() => false)) {
      try { await byRole.click({ timeout: 8_000 }); return true } catch (_) {}
    }
  }
  for (const name of names) {
    const byText = page.getByText(name).first()
    if (await byText.isVisible().catch(() => false)) {
      try { await byText.click({ timeout: 8_000 }); return true } catch (_) {}
    }
  }
  return false
}

export async function dismissToasts (page: Page) {
  const closers = page.getByRole('button', { name: /close|dismiss/i })
  const n = await closers.count().catch(() => 0)
  for (let i = 0; i < n; i++) {
    await closers.nth(i).click({ timeout: 2_000 }).catch(() => {})
  }
}

export async function openApp (page: Page) {
  await page.goto('/')
  await page.locator('#root').first().waitFor({ state: 'attached', timeout: 30_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
}

export async function ensureBudgetOpen (page: Page, name = 'Test Budget') {
  const addAccountPrompt = page.getByText(/you need to .*add an account|add an account/i).first()
  if (await addAccountPrompt.isVisible().catch(() => false)) return

  await clickFirst(page, [
    /create blank budget/i,
    /start fresh/i,
    /create new budget/i,
    /create.*budget/i
  ])

  await page
    .getByRole('button', { name: /^add account$/i })
    .first()
    .waitFor({ state: 'visible', timeout: 90_000 })
  await dismissToasts(page)
}

export async function addAccount (page: Page, name = 'Checking', balance = '1000', info?: TestInfo) {
  const addBtn = page.getByRole('button', { name: /^add account$/i }).first()
  await addBtn.waitFor({ state: 'visible', timeout: 60_000 })
  await addBtn.click()

  await clickFirst(page, [/create a local account/i, /create local account/i])
  if (info) await shoot(page, info, 'account-modal')

  const nameField = page
    .getByPlaceholder(/account name|name/i)
    .or(page.getByLabel(/account name|name/i))
    .or(page.getByRole('textbox').first())
    .first()
  await nameField.waitFor({ state: 'visible', timeout: 20_000 })
  await nameField.fill(name)

  const balanceField = page
    .getByPlaceholder(/balance|0\.00/i)
    .or(page.getByLabel(/balance/i))
    .first()
  if (await balanceField.isVisible().catch(() => false)) {
    await balanceField.fill(balance)
  }

  await clickFirst(page, [/^create$/i, /^add$/i, /create account/i, /^add account$/i])
  await expect(page.getByText(name, { exact: false }).first()).toBeVisible({ timeout: 20_000 })
}

export async function addTransaction (page: Page, payee = 'Groceries', amount = '-42.50', info?: TestInfo) {
  await clickFirst(page, [/add new transaction/i, /new transaction/i, /^add$/i])
  if (info) await shoot(page, info, 'transaction-modal')

  const amountField = page.getByPlaceholder(/amount|0\.00/i).or(page.getByLabel(/amount/i)).first()
  if (await amountField.isVisible().catch(() => false)) {
    await amountField.fill(amount)
  }
  const payeeField = page.getByPlaceholder(/payee/i).or(page.getByLabel(/payee/i)).first()
  if (await payeeField.isVisible().catch(() => false)) {
    await payeeField.fill(payee)
  }
  await clickFirst(page, [/^add$/i, /^save$/i, /add transaction/i])
  await page.waitForLoadState('networkidle').catch(() => {})
}
