import { test, expect } from '@playwright/test';

const AUTH_API = /\/api\/Auth\/(login|register)/;

test.describe('Auth', () => {
  test.describe('Login page', () => {
    test('should display login form and required elements', async ({ page }) => {
      await page.goto('/logIn');

      await expect(page.getByRole('heading', { name: /login/i })).toBeVisible();
      await expect(page.getByPlaceholder(/phone/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /create one/i })).toBeVisible();
    });

    test('should have sign in button disabled when phone or password is empty', async ({ page }) => {
      await page.goto('/logIn');

      const signInBtn = page.getByRole('button', { name: /sign in/i });
      await expect(signInBtn).toBeDisabled();

      await page.getByPlaceholder(/phone/i).fill('+1234567890');
      await expect(signInBtn).toBeDisabled();

      await page.getByPlaceholder(/password/i).fill('password');
      await expect(signInBtn).toBeEnabled();
    });

    test('should show error on failed login when API returns error', async ({ page }) => {
      await page.route(AUTH_API, (route) => {
        if (route.request().method() === 'POST' && route.request().url().includes('login')) {
          return route.fulfill({ status: 401, body: 'Invalid credentials' });
        }
        return route.continue();
      });

      await page.goto('/logIn');
      await page.getByPlaceholder(/phone/i).fill('+1999999999');
      await page.getByPlaceholder(/password/i).fill('wrongpassword');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page.getByText(/invalid credentials|login failed/i)).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to /posts and store token on successful login', async ({ page }) => {
      await page.route(AUTH_API, (route) => {
        if (route.request().method() === 'POST' && route.request().url().includes('login')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiVGVzdCIsInBob25lTnVtYmVyIjoiKzEyMzQ1Njc4OTAifQ.x',
              name: 'Test User',
              phoneNumber: '+1234567890',
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/logIn');
      await page.getByPlaceholder(/phone/i).fill('+1234567890');
      await page.getByPlaceholder(/password/i).fill('validpassword');
      await page.getByRole('button', { name: /sign in/i }).click();

      await expect(page).toHaveURL(/\/posts/, { timeout: 10000 });
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });
  });

  test.describe('Register page', () => {
    test('should display register form and required fields', async ({ page }) => {
      await page.goto('/register');

      await expect(page.getByRole('heading', { name: /register/i })).toBeVisible();
      await expect(page.getByPlaceholder(/first name/i)).toBeVisible();
      await expect(page.getByPlaceholder(/last name/i)).toBeVisible();
      await expect(page.getByPlaceholder(/phone/i)).toBeVisible();
      await expect(page.getByPlaceholder(/password/i)).toBeVisible();
      await expect(page.getByPlaceholder(/city/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /create account/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
    });

    test('should have create account button disabled when phone or password is empty', async ({ page }) => {
      await page.goto('/register');

      const createBtn = page.getByRole('button', { name: /create account/i });
      await expect(createBtn).toBeDisabled();

      await page.getByPlaceholder(/phone/i).fill('+1234567890');
      await page.getByPlaceholder(/password/i).fill('password123');
      await expect(createBtn).toBeEnabled();
    });

    test('should show error when registration API fails', async ({ page }) => {
      await page.route(AUTH_API, (route) => {
        if (route.request().method() === 'POST' && route.request().url().includes('register')) {
          return route.fulfill({ status: 400, body: 'Phone number already exists' });
        }
        return route.continue();
      });

      await page.goto('/register');
      await page.getByPlaceholder(/phone/i).fill('+1999999999');
      await page.getByPlaceholder(/password/i).fill('password123');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page.getByText(/phone number already exists|registration failed/i)).toBeVisible({ timeout: 5000 });
    });

    test('should redirect to /posts on successful registration', async ({ page }) => {
      await page.route(AUTH_API, (route) => {
        if (route.request().method() === 'POST' && route.request().url().includes('register')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJuYW1lIjoiTmV3IiwicGhvbmVOdW1iZXIiOiIrMTIzNDU2Nzg5MCJ9.x',
              name: 'New User',
              phoneNumber: '+1234567890',
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/register');
      await page.getByPlaceholder(/first name/i).fill('New');
      await page.getByPlaceholder(/last name/i).fill('User');
      await page.getByPlaceholder(/phone/i).fill('+1234567890');
      await page.getByPlaceholder(/password/i).fill('password123');
      await page.getByRole('button', { name: /create account/i }).click();

      await expect(page).toHaveURL(/\/posts/, { timeout: 10000 });
      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeTruthy();
    });
  });

  test.describe('Navigation between auth pages', () => {
    test('should navigate from login to register via create one link', async ({ page }) => {
      await page.goto('/logIn');
      await page.getByRole('link', { name: /create one/i }).click();
      await expect(page).toHaveURL(/\/register/);
    });

    test('should navigate from register to login via sign in link', async ({ page }) => {
      await page.goto('/register');
      await page.getByRole('link', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/logIn/);
    });
  });

  test.describe('Logout', () => {
    test('should redirect to login and clear storage on logout', async ({ page }) => {
      await page.route(AUTH_API, (route) => {
        if (route.request().method() === 'POST' && route.request().url().includes('login')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({
              token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.x.x',
              name: 'Test',
              phoneNumber: '+1234567890',
            }),
          });
        }
        return route.continue();
      });

      await page.goto('/logIn');
      await page.getByPlaceholder(/phone/i).fill('+1234567890');
      await page.getByPlaceholder(/password/i).fill('pass');
      await page.getByRole('button', { name: /sign in/i }).click();
      await expect(page).toHaveURL(/\/posts/, { timeout: 10000 });

      await page.getByRole('button', { name: /log out/i }).click();
      await expect(page).toHaveURL(/\/logIn/, { timeout: 5000 });

      const token = await page.evaluate(() => localStorage.getItem('token'));
      expect(token).toBeNull();
    });
  });
});
