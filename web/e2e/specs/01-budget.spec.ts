import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { openApp, ensureBudgetOpen, addAccount, addTransaction } from '../helpers/actual'

test.use({ video: 'on' })

test('login, create a budget, add an account and a transaction', async ({ page }, info) => {
  await openApp(page)
  await shoot(page, info, 'index')

  await ensureBudgetOpen(page, 'Test Budget')
  await shoot(page, info, 'budget')

  await addAccount(page, 'Checking', '1000')
  await shoot(page, info, 'account-created')

  await addTransaction(page, 'Groceries', '-42.50')
  await shoot(page, info, 'transaction-added')

  await expect(page.locator('#root')).toBeVisible()
})
