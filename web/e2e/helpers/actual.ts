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
  const reportsNav = page.getByText(/^reports$/i).first()
  if (await reportsNav.isVisible().catch(() => false)) return

  const existingFile = page.getByText(/available for download/i).first()
  if (await existingFile.isVisible().catch(() => false)) {
    await existingFile.click()
  } else {
    await clickFirst(page, [
      /create blank budget/i,
      /start fresh/i,
      /create new file/i,
      /create new budget/i,
      /create.*budget/i
    ])
  }

  await reportsNav.waitFor({ state: 'visible', timeout: 90_000 })
  await dismissToasts(page)
}

export async function addAccount (page: Page, name = 'Checking', balance = '1000', info?: TestInfo) {
  if (await page.getByText(name, { exact: false }).first().isVisible().catch(() => false)) {
    return
  }
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

export type Txn = { payee: string, amount: string }

export async function addTransactions (page: Page, txns: Txn[], info?: TestInfo) {
  const addNew = page
    .getByRole('button', { name: /^add new$/i })
    .or(page.getByTestId('add-transaction-button'))
    .first()
  await addNew.waitFor({ state: 'visible', timeout: 20_000 })
  await addNew.click()

  const row = page.getByTestId('new-transaction').first()
  await row.waitFor({ state: 'visible', timeout: 20_000 })
  if (info) await shoot(page, info, 'transaction-row')

  for (const t of txns) {
    const negative = t.amount.trim().startsWith('-')
    const magnitude = t.amount.replace('-', '')

    const payee = row.getByTestId('payee-field').or(row.getByTestId('payee')).first()
    if (await payee.isVisible().catch(() => false)) {
      await payee.click()
      await page.keyboard.type(t.payee)
      await page.keyboard.press('Tab')
    }

    const amount = (negative ? row.getByTestId('amount-outflow') : row.getByTestId('amount-inflow'))
      .or(row.getByTestId('amount-input'))
      .or(row.getByTestId('amount'))
      .first()
    if (await amount.isVisible().catch(() => false)) {
      await amount.click()
      await page.keyboard.type(magnitude)
    }

    await page.keyboard.press('Enter')
    await page.waitForTimeout(800)
  }

  await page.keyboard.press('Escape').catch(() => {})
  await page.waitForLoadState('networkidle').catch(() => {})
}
