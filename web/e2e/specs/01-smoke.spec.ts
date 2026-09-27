import { test, expect } from '@playwright/test'
import { shoot } from '../helpers/screenshot'
import { loginViaAuthelia } from '../helpers/auth'
import { ensureBudgetOpen } from '../helpers/actual'

test.use({ video: 'on' })

const baseURL = `https://actual-budget.${process.env.PLAYWRIGHT_DOMAIN}`
const username = process.env.PLAYWRIGHT_USER as string
const password = process.env.PLAYWRIGHT_PASSWORD as string

test('login via OpenID and open a budget', async ({ page }, info) => {
  await loginViaAuthelia(page, baseURL, username, password, info)
  await shoot(page, info, 'index')

  await ensureBudgetOpen(page, 'Test Budget')
  await shoot(page, info, 'budget')

  await expect(page.locator('#root')).toBeVisible()
})
