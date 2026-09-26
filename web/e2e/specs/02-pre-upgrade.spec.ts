import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, addAccount, addTransactions, openAccount, transactionVisible } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN || 'bookworm.com'}`
const username = process.env.PLAYWRIGHT_USER || 'user'
const password = process.env.PLAYWRIGHT_PASSWORD || 'Password1'

test('seed budget data that must survive the upgrade', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await ensureBudgetOpen(page, 'Test Budget')

  await addAccount(page, 'Checking', '1000', info)
  await openAccount(page, 'Checking')

  if (!(await transactionVisible(page, 'Salary'))) {
    await addTransactions(page, [
      { payee: 'Salary', amount: '2500.00' },
      { payee: 'Groceries', amount: '-42.50' }
    ], info)
    await openAccount(page, 'Checking')
  }

  await shoot(page, info, 'seeded')
  await expect(page.getByText('Salary', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Groceries', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
})
