import { expect, test } from '@playwright/test';

test('minimal full-stack smoke: register, login, create and delete customer', async ({ page, request }) => {
  test.setTimeout(120_000);

  const unique = Date.now().toString();
  const phone = `+1555${unique.slice(-7)}`;
  const password = 'P@ssw0rd123!';
  const organization = `e2e-org-${unique}`;
  const customerName = `E2E${unique.slice(-4)}`;

  // Seed test user directly through backend to avoid UI register race/validation flakiness.
  const registerRes = await request.post('http://127.0.0.1:5207/api/Auth/register', {
    data: {
      organizationName: organization,
      name: 'E2E',
      lastName: 'Tester',
      phoneNumber: phone,
      password,
    },
  });
  expect(registerRes.ok()).toBeTruthy();

  await page.goto('/logIn', { waitUntil: 'domcontentloaded', timeout: 60_000 });
  await expect(page.getByPlaceholder(/phone number/i)).toBeVisible({ timeout: 20_000 });
  await page.getByPlaceholder(/phone number/i).fill(phone);
  await page.getByPlaceholder(/password/i).fill(password);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect
    .poll(async () => page.evaluate(() => localStorage.getItem('token')), { timeout: 60_000 })
    .not.toBeNull();
  await expect(page).toHaveURL(/\/(home|customers|users|sales|no-access)$/, { timeout: 60_000 });

  await page.locator('a[href="/customers"]').first().click();
  await expect(page).toHaveURL(/\/customers$/);
  const createForm = page.locator('form').first();
  const createInputs = createForm.locator('input');
  await createInputs.nth(0).fill(customerName);
  await createInputs.nth(1).fill('Customer');
  await createInputs.nth(2).fill('City');
  await createInputs.nth(3).fill(`${customerName.toLowerCase()}@example.com`);
  await createForm.locator('button[type="submit"]').click();
  await expect(page.getByText(customerName).first()).toBeVisible();

  const row = page.locator('div').filter({ hasText: customerName }).first();
  await row.getByRole('button', { name: /delete/i }).click();
  await expect(page.getByText(customerName).first()).toBeHidden({ timeout: 15_000 });
});
