import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, addAccount, addTransaction } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN || 'bookworm.com'}`
const username = process.env.PLAYWRIGHT_USER || 'user'
const password = process.env.PLAYWRIGHT_PASSWORD || 'Password1'

test('login via OpenID, create a budget, add an account and a transaction', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await shoot(page, info, 'index')

  await ensureBudgetOpen(page, 'Test Budget')
  await shoot(page, info, 'budget')

  await addAccount(page, 'Checking', '1000')
  await shoot(page, info, 'account-created')

  await addTransaction(page, 'Groceries', '-42.50')
  await shoot(page, info, 'transaction-added')

  await expect(page.locator('#root')).toBeVisible()
})
