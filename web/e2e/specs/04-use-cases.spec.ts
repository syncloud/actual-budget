import { test } from '@playwright/test'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen, addAccount, addTransactions, openAccount, transactionVisible, assertAmount } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN}`
const username = process.env.PLAYWRIGHT_USER as string
const password = process.env.PLAYWRIGHT_PASSWORD as string

test('accounts track income, expenses and their own running balance', async ({ page }, info) => {
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

  await addAccount(page, 'Savings', '5000', info)
  await openAccount(page, 'Savings')
  if (!(await transactionVisible(page, 'Bonus'))) {
    await addTransactions(page, [
      { payee: 'Bonus', amount: '1500.00' },
      { payee: 'Fees', amount: '-25.00' }
    ], info)
    await openAccount(page, 'Savings')
  }
  await assertAmount(page, /1[,.]?500\.00/, info, 'savings-income')
  await assertAmount(page, /25\.00/, info, 'savings-expense')
  await assertAmount(page, /6[,.]?475\.00/, info, 'savings-balance')
})
