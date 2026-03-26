/**
 * GluMira™ E2E — Dashboard & Navigation Tests
 * Version: 7.0.0
 *
 * Tests:
 *  1. Landing page renders hero and CTA
 *  2. Pricing page renders all 3 tiers
 *  3. Health endpoint returns ok
 *  4. Authenticated dashboard renders IOB card and TIR ring (with credentials)
 *  5. Sidebar navigation links are present (with credentials)
 *  6. Glucose log page renders entry form (with credentials)
 *  7. Stacking page renders dose entry form (with credentials)
 *  8. Trends page renders TIR section (with credentials)
 *
 * Requires: E2E_TEST_EMAIL and E2E_TEST_PASSWORD for authenticated tests.
 */

import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
const HAS_CREDENTIALS = !!TEST_EMAIL && !!TEST_PASSWORD;

// ─── Public pages ─────────────────────────────────────────────

test("landing page renders hero section", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  // GluMira tagline
  await expect(page.getByText(/science of insulin/i)).toBeVisible();
});

test("landing page has CTA button linking to register", async ({ page }) => {
  await page.goto("/");
  const cta = page.getByRole("link", { name: /start free|join beta|get started/i }).first();
  await expect(cta).toBeVisible();
});

test("pricing page renders 3 tiers", async ({ page }) => {
  await page.goto("/pricing");
  await expect(page.getByText(/GluMira Free|Free Beta/i)).toBeVisible();
  await expect(page.getByText(/GluMira Pro/i)).toBeVisible();
  await expect(page.getByText(/GluMira AI/i)).toBeVisible();
});

test("health endpoint returns ok status", async ({ request }) => {
  const res = await request.get("/api/health");
  expect(res.status()).toBe(200);
  const body = await res.json();
  expect(body.status).toBe("ok");
});

// ─── Authenticated pages (skipped without credentials) ────────

test.describe("Authenticated flows", () => {
  test.skip(!HAS_CREDENTIALS);

  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
  });

  test("dashboard renders IOB card", async ({ page }) => {
    await expect(page.getByText(/insulin on board|iob/i)).toBeVisible();
  });

  test("dashboard renders TIR ring", async ({ page }) => {
    await expect(page.getByText(/time in range|TIR/i)).toBeVisible();
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await expect(page.getByRole("link", { name: /dashboard/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /glucose/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /doses/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /meals/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /stacking/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /trends/i })).toBeVisible();
  });

  test("glucose log page renders entry form", async ({ page }) => {
    await page.goto("/glucose");
    await expect(page.getByLabel(/glucose value/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /log reading/i })).toBeVisible();
  });

  test("stacking page renders dose entry form", async ({ page }) => {
    await page.goto("/stacking");
    await expect(page.getByText(/insulin stacking/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /add dose|analyse/i })).toBeVisible();
  });

  test("trends page renders TIR section", async ({ page }) => {
    await page.goto("/trends");
    await expect(page.getByText(/time in range|glucose management/i)).toBeVisible();
  });

  test("school care plan page renders generate button", async ({ page }) => {
    await page.goto("/school-care-plan");
    await expect(page.getByRole("button", { name: /generate/i })).toBeVisible();
  });
});
