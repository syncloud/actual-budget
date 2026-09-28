import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { openExistingBudget, openAccount, assertAmount } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN}`
const username = process.env.PLAYWRIGHT_USER as string
const password = process.env.PLAYWRIGHT_PASSWORD as string

test('budget data survived the upgrade', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await openExistingBudget(page)
  await shoot(page, info, 'post-upgrade-index')

  await expect(page.getByText('Checking', { exact: false }).first()).toBeVisible({ timeout: 60_000 })
  await openAccount(page, 'Checking')

  await expect(page.getByText('Salary', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await expect(page.getByText('Groceries', { exact: false }).first()).toBeVisible({ timeout: 30_000 })
  await assertAmount(page, /2[,.]?500\.00/, info, 'post-upgrade-income')
  await assertAmount(page, /42\.50/, info, 'post-upgrade-expense')
  await assertAmount(page, /3[,.]?457\.50/, info, 'post-upgrade-balance')
})
