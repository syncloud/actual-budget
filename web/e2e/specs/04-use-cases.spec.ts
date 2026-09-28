import { test } from '@playwright/test'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, addAccount, addTransactions, openAccount, transactionVisible, assertAmount } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN}`
const username = process.env.PLAYWRIGHT_USER as string
const password = process.env.PLAYWRIGHT_PASSWORD as string

test('income and expenses keep the account balance correct', async ({ page }, info) => {
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
  await assertAmount(page, /2[,.]?500\.00/, info, 'checking-income')
  await assertAmount(page, /42\.50/, info, 'checking-expense')
  await assertAmount(page, /3[,.]?457\.50/, info, 'checking-balance')

  if (!(await transactionVisible(page, 'Rent'))) {
    await addTransactions(page, [
      { payee: 'Rent', amount: '-500.00' }
    ], info)
    await openAccount(page, 'Checking')
  }
  await assertAmount(page, /Rent/, info, 'checking-rent')
  await assertAmount(page, /2[,.]?957\.50/, info, 'checking-balance-after-rent')
})
