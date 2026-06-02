import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, addAccount, addTransactions } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN || 'bookworm.com'}`
const username = process.env.PLAYWRIGHT_USER || 'user'
const password = process.env.PLAYWRIGHT_PASSWORD || 'Password1'

test('login via OpenID, create a budget, add an account and a transaction', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await shoot(page, info, 'index')

  await ensureBudgetOpen(page, 'Test Budget')
  await shoot(page, info, 'budget')

  if (info.project.name === 'desktop') {
    await addAccount(page, 'Checking', '1000', info)
    await shoot(page, info, 'account-created')

    await addTransactions(page, [
      { payee: 'Salary', amount: '2500.00' },
      { payee: 'Groceries', amount: '-42.50' },
      { payee: 'Coffee Shop', amount: '-4.75' },
      { payee: 'Electric Bill', amount: '-88.20' }
    ], info)
    await shoot(page, info, 'transactions-added')
  }

  await expect(page.locator('#root')).toBeVisible()
})
