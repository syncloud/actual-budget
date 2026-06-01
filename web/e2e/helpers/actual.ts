import { Page, expect } from '@playwright/test'

async function clickFirst (page: Page, names: RegExp[]): Promise<boolean> {
  for (const name of names) {
    const byRole = page.getByRole('button', { name }).first()
    if (await byRole.count() > 0) {
      try { await byRole.click({ timeout: 8_000 }); return true } catch (_) {}
    }
    const byText = page.getByText(name).first()
    if (await byText.count() > 0) {
      try { await byText.click({ timeout: 8_000 }); return true } catch (_) {}
    }
  }
  return false
}

export async function openApp (page: Page) {
  await page.goto('/')
  await page.locator('#root').first().waitFor({ state: 'attached', timeout: 30_000 })
  await page.waitForLoadState('networkidle').catch(() => {})
}

export async function ensureBudgetOpen (page: Page, name = 'Test Budget') {
  const onBudget = page.locator('[data-testid="budget-table"], [aria-label="Budget"]').first()
  if (await onBudget.count() > 0 && await onBudget.isVisible().catch(() => false)) {
    return
  }
  const created = await clickFirst(page, [
    /create new budget/i,
    /start fresh/i,
    /create blank budget/i,
    /new budget/i
  ])
  if (created) {
    const nameField = page.getByLabel(/budget name/i).first()
    if (await nameField.count() > 0) {
      await nameField.fill(name)
      await clickFirst(page, [/create/i, /next/i, /continue/i])
    }
  }
  await page.waitForLoadState('networkidle').catch(() => {})
  await expect(page.locator('#root')).toBeVisible()
}

export async function addAccount (page: Page, name = 'Checking', balance = '1000') {
  await clickFirst(page, [/add account/i, /add an account/i, /create account/i])
  const nameField = page.getByLabel(/account name|name/i).first()
  await nameField.waitFor({ state: 'visible', timeout: 15_000 })
  await nameField.fill(name)
  const balanceField = page.getByLabel(/balance/i).first()
  if (await balanceField.count() > 0) {
    await balanceField.fill(balance)
  }
  await clickFirst(page, [/^create$/i, /add account/i, /create account/i, /save/i])
  await expect(page.getByText(name).first()).toBeVisible({ timeout: 20_000 })
}

export async function addTransaction (page: Page, payee = 'Groceries', amount = '-42.50') {
  await clickFirst(page, [/^add$/i, /add new transaction/i, /new transaction/i, /^\+$/])
  const amountField = page.getByLabel(/amount/i).first()
  if (await amountField.count() > 0) {
    await amountField.fill(amount)
  }
  const payeeField = page.getByLabel(/payee/i).first()
  if (await payeeField.count() > 0) {
    await payeeField.fill(payee)
  }
  await clickFirst(page, [/^add$/i, /^save$/i])
  await page.waitForLoadState('networkidle').catch(() => {})
}
