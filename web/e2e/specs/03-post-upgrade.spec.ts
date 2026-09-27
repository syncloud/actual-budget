import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, openAccount } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN}`
const username = process.env.PLAYWRIGHT_USER as string
const password = process.env.PLAYWRIGHT_PASSWORD as string

test('budget data survived the upgrade', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await ensureBudgetOpen(page, 'Test Budget')
  await shoot(page, info, 'post-upgrade-index')

  await expect(page.getByText('Checking', { exact: false }).first()).toBeVisible({ timeout: 60_000 })
  await openAccount(page, 'Checking')
  await shoot(page, info, 'post-upgrade-account')

  // The rows must survive, and so must their amounts (the point of the test).
  await expect(page.getByText('Salary', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/2[,.]?500\.00/).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Groceries', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText(/42\.50/).first()).toBeVisible({ timeout: 30_000 })

  // Account balance = 1000 starting + 2500.00 - 42.50 = 3457.50.
  await expect(page.getByText(/3[,.]?457\.50/).first()).toBeVisible({ timeout: 30_000 })
})
