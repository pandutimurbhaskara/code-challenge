import { test, expect } from '@playwright/test'
import { mkdirSync } from 'node:fs'

const SHOTS = 'e2e/screenshots'

const prices = [
  { currency: 'ETH', date: '2023-08-29T07:10:40.000Z', price: 1800.25 },
  { currency: 'USDC', date: '2023-08-29T07:10:40.000Z', price: 1 },
  { currency: 'WBTC', date: '2023-08-29T07:10:40.000Z', price: 29850 },
  { currency: 'USDT', date: '2023-08-29T07:10:40.000Z', price: 1 },
  { currency: 'ATOM', date: '2023-08-29T07:10:40.000Z', price: 7.18 },
  { currency: 'OSMO', date: '2023-08-29T07:10:40.000Z', price: 0.38 },
  { currency: 'LUNA', date: '2023-08-29T07:10:40.000Z', price: 0.42 },
  { currency: 'BLUR', date: '2023-08-29T07:10:40.000Z', price: 0.208 },
]

test.beforeAll(() => {
  mkdirSync(SHOTS, { recursive: true })
})

test.beforeEach(async ({ page }) => {
  await page.route('**/prices.json', (route) => route.fulfill({ json: prices }))
})

test('swap flow', async ({ page }) => {
  await page.goto('/')

  const pay = page.getByLabel('You pay')
  await pay.waitFor()
  await page.screenshot({ path: `${SHOTS}/01-initial.png`, fullPage: true, animations: 'disabled' })

  await page.getByRole('button', { name: 'ETH', exact: true }).click()
  await page.getByRole('dialog').waitFor()
  await page.screenshot({ path: `${SHOTS}/02-token-picker.png`, fullPage: true, animations: 'disabled' })
  await page.keyboard.press('Escape')

  await pay.fill('0.1')
  await expect(page.getByLabel('You receive')).not.toHaveValue('')
  await page.screenshot({ path: `${SHOTS}/03-amount.png`, fullPage: true, animations: 'disabled' })

  await page.getByRole('button', { name: /^Swap / }).click()
  await expect(page.getByRole('status')).toContainText('Swapped')
  await page.screenshot({ path: `${SHOTS}/04-receipt.png`, fullPage: true, animations: 'disabled' })
})

test('light theme', async ({ page }) => {
  await page.goto('/?theme=light')
  await page.getByLabel('You pay').waitFor()
  await page.screenshot({ path: `${SHOTS}/05-light-theme.png`, fullPage: true, animations: 'disabled' })
})
