import { test } from '@playwright/test'
import { loginViaAuthelia } from '../helpers/auth'
import { createBudget, addAccount, addTransactions, openAccount, transactionVisible, assertAmount } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN}`
const username = process.env.PLAYWRIGHT_USER as string
const password = process.env.PLAYWRIGHT_PASSWORD as string

test('a user signs in and budgets across two accounts with correct balances', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await createBudget(page)

  await test.step('checking: salary in, groceries out', async () => {
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
  })

  await test.step('checking: record the rent', async () => {
    if (!(await transactionVisible(page, 'Rent'))) {
      await addTransactions(page, [{ payee: 'Rent', amount: '-500.00' }], info)
      await openAccount(page, 'Checking')
    }
    await assertAmount(page, /Rent/, info, 'checking-rent')
    await assertAmount(page, /2[,.]?957\.50/, info, 'checking-balance-after-rent')
  })

  await test.step('savings: keeps its own balance', async () => {
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
})
