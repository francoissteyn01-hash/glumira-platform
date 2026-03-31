/**
 * GluMira™ E2E — Auth Flow Tests
 * Version: 7.0.0
 *
 * Tests:
 *  1. Unauthenticated redirect to /login
 *  2. Login form renders correctly
 *  3. Login with invalid credentials shows error
 *  4. Login with valid credentials redirects to dashboard
 *  5. Register form renders correctly
 *  6. Register with mismatched passwords shows error
 *  7. Logout clears session and redirects to /login
 *
 * Requires: E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars for live tests.
 * In CI without credentials, live login tests are skipped.
 */

import { test, expect } from "@playwright/test";

const TEST_EMAIL = process.env.E2E_TEST_EMAIL ?? "";
const TEST_PASSWORD = process.env.E2E_TEST_PASSWORD ?? "";
const HAS_CREDENTIALS = !!TEST_EMAIL && !!TEST_PASSWORD;

// ─── Unauthenticated redirect ─────────────────────────────────

test("unauthenticated user is redirected from /dashboard to /login", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});

test("unauthenticated user is redirected from /stacking to /login", async ({ page }) => {
  await page.goto("/stacking");
  await expect(page).toHaveURL(/\/login/);
});

// ─── Login page ───────────────────────────────────────────────

test("login page renders email and password fields", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/password/i)).toBeVisible();
  await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
});

test("login page has link to register", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("link", { name: /create account/i })).toBeVisible();
});

test("login with invalid credentials shows error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("invalid@example.com");
  await page.getByLabel(/password/i).fill("wrongpassword");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page.getByText(/invalid|incorrect|error/i)).toBeVisible({ timeout: 8000 });
});

test.skip(!HAS_CREDENTIALS, "login with valid credentials redirects to dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });
});

// ─── Register page ────────────────────────────────────────────

test("register page renders all required fields", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/^password/i)).toBeVisible();
  await expect(page.getByLabel(/confirm password/i)).toBeVisible();
});

test("register with mismatched passwords shows error", async ({ page }) => {
  await page.goto("/register");
  await page.getByLabel(/email/i).fill("test@example.com");
  await page.getByLabel(/^password/i).fill("Password123!");
  await page.getByLabel(/confirm password/i).fill("Different123!");
  await page.getByRole("button", { name: /create account/i }).click();
  await expect(page.getByText(/passwords? do not match|mismatch/i)).toBeVisible({ timeout: 5000 });
});

test("register page has link back to login", async ({ page }) => {
  await page.goto("/register");
  await expect(page.getByRole("link", { name: /sign in/i })).toBeVisible();
});

// ─── Logout ───────────────────────────────────────────────────

test.skip(!HAS_CREDENTIALS, "logout clears session and redirects to login", async ({ page }) => {
  // Login first
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(TEST_EMAIL);
  await page.getByLabel(/password/i).fill(TEST_PASSWORD);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 10000 });

  // Logout
  await page.getByRole("button", { name: /sign out/i }).click();
  await expect(page).toHaveURL(/\/login/, { timeout: 5000 });

  // Verify session is cleared
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login/);
});
