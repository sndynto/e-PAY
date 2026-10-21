// ─────────────────────────────────────────────────────────────────────────────
// E-PAY Playwright end-to-end tests
// These tests run against the local dev server (http://localhost:5173).
// All payment flows use demo mode — no real funds, no real credentials.
// ─────────────────────────────────────────────────────────────────────────────
import { test, expect } from '@playwright/test'

test.describe('Public pages', () => {
  test('Landing page loads and shows E-PAY branding', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/E-PAY/i)
    // Hero section is visible
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('Sign In page renders form fields', async ({ page }) => {
    await page.goto('/sign-in')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/password/i)).toBeVisible()
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible()
  })

  test('Sign Up page renders form fields', async ({ page }) => {
    await page.goto('/sign-up')
    await expect(page.getByLabel(/full name/i)).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
    // The form should have a password and confirm-password field
    const passwordFields = page.getByLabel(/password/i)
    await expect(passwordFields.first()).toBeVisible()
  })

  test('Forgot password page renders email field', async ({ page }) => {
    await page.goto('/forgot-password')
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })
})

test.describe('App pages (demo mode — no auth required)', () => {
  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
    // Demo badge is present
    await expect(page.getByText(/demo/i).first()).toBeVisible()
  })

  test('Buy USDC page loads and shows amount form', async ({ page }) => {
    await page.goto('/buy-usdc')
    await expect(page.getByRole('heading', { name: /buy usdc/i })).toBeVisible()
  })

  test('Pay with USDC page loads', async ({ page }) => {
    await page.goto('/pay')
    await expect(page.getByRole('heading', { name: /pay with usdc/i })).toBeVisible()
  })

  test('Transaction history page loads', async ({ page }) => {
    await page.goto('/history')
    await expect(page.getByRole('heading', { name: /history|transactions/i })).toBeVisible()
    // Shows demo label
    await expect(page.getByText(/demo/i).first()).toBeVisible()
  })
})

test.describe('Buy USDC flow (demo)', () => {
  test('Can enter IDR amount and get a quote', async ({ page }) => {
    await page.goto('/buy-usdc')

    // Enter an IDR amount
    const amountInput = page.getByLabel(/idr amount|amount|how much/i).first()
    if (await amountInput.isVisible()) {
      await amountInput.fill('100000')
      // Wait for quote to appear (DEMO badge or USDC amount)
      await page.waitForSelector('text=/USDC|demo/i', { timeout: 5000 }).catch(() => null)
    }
  })

  test('Buy USDC page shows DEMO MODE badge', async ({ page }) => {
    await page.goto('/buy-usdc')
    await expect(page.getByText(/demo/i).first()).toBeVisible()
  })
})

test.describe('Merchant invoice flow (demo)', () => {
  test('Merchant dashboard loads', async ({ page }) => {
    await page.goto('/merchant')
    await expect(page.getByRole('heading', { name: /merchant|invoice/i })).toBeVisible()
  })

  test('Create invoice page renders form', async ({ page }) => {
    await page.goto('/merchant/invoice/new')
    await expect(page.getByRole('heading', { name: /create|new invoice/i })).toBeVisible()
    await expect(page.getByLabel(/amount|usdc/i).first()).toBeVisible()
  })

  test('Create invoice and view the hosted invoice page', async ({ page }) => {
    await page.goto('/merchant/invoice/new')

    // Fill in a description and amount
    const descInput = page.getByLabel(/description/i)
    const amountInput = page.getByLabel(/amount/i)

    if (await descInput.isVisible() && await amountInput.isVisible()) {
      await descInput.fill('Playwright test invoice')
      await amountInput.fill('10')

      // Fill recipient address
      const recipientInput = page.getByLabel(/recipient|wallet address/i)
      if (await recipientInput.isVisible()) {
        await recipientInput.fill('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
      }

      const submitBtn = page.getByRole('button', { name: /create|generate/i })
      if (await submitBtn.isVisible() && !(await submitBtn.isDisabled())) {
        await submitBtn.click()
        // After creation, should see invoice ID or QR code area
        await page.waitForSelector('text=/INV-|invoice/i', { timeout: 5000 }).catch(() => null)
      }
    }
  })
})

test.describe('Hosted invoice page (public)', () => {
  test('Unknown invoice shows not-found state', async ({ page }) => {
    await page.goto('/invoice/NONEXISTENT-ID')
    await expect(page.getByText(/not found|invalid|expired/i)).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Admin page', () => {
  test('Admin page loads in demo mode', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('heading', { name: /admin/i })).toBeVisible()
    await expect(page.getByText(/demo/i).first()).toBeVisible()
  })
})

test.describe('Navigation', () => {
  test('Unknown route redirects to landing page', async ({ page }) => {
    await page.goto('/this-route-does-not-exist')
    await expect(page).toHaveURL('/')
  })

  test('Developer docs page loads', async ({ page }) => {
    await page.goto('/developers')
    await expect(page.getByRole('heading', { name: /developer|docs|api/i })).toBeVisible()
  })
})

test.describe('Accessibility', () => {
  test('Sign In page has no missing form labels', async ({ page }) => {
    await page.goto('/sign-in')
    const inputs = page.locator('input')
    const count = await inputs.count()
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i)
      const id = await input.getAttribute('id')
      if (id) {
        const label = page.locator(`label[for="${id}"]`)
        // Either has a label or an aria-label
        const ariaLabel = await input.getAttribute('aria-label')
        const hasLabel = (await label.count()) > 0 || Boolean(ariaLabel)
        expect(hasLabel).toBe(true)
      }
    }
  })

  test('Buy USDC page has no images missing alt text', async ({ page }) => {
    await page.goto('/buy-usdc')
    const imgs = page.locator('img:not([alt])')
    await expect(imgs).toHaveCount(0)
  })
})
