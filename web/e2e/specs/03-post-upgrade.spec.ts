import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, openAccount } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN || 'bookworm.com'}`
const username = process.env.PLAYWRIGHT_USER || 'user'
const password = process.env.PLAYWRIGHT_PASSWORD || 'Password1'

test('budget data survived the upgrade', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await ensureBudgetOpen(page, 'Test Budget')
  await shoot(page, info, 'post-upgrade-index')

  await expect(page.getByText('Checking', { exact: false }).first()).toBeVisible({ timeout: 60_000 })
  await openAccount(page, 'Checking')
  await shoot(page, info, 'post-upgrade-account')

  await expect(page.getByText('Salary', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Groceries', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
})
