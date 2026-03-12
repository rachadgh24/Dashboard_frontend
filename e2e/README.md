# E2E tests (Playwright)

## Auth tests

Run all auth tests:

```bash
npm run test:e2e
```

Or only the auth spec:

```bash
npx playwright test e2e/auth.spec.ts
```

**First-time setup:** Install browsers (required once):

```bash
npx playwright install
```

## What is tested

- **Login:** Form visibility, disabled submit when empty, error on failed API, redirect and token storage on success
- **Register:** Form visibility, disabled submit when email/password empty, error on failed API, redirect on success
- **Navigation:** Login ↔ Register links
- **Logout:** Redirect to login and localStorage cleared

Auth API calls are mocked in tests, so the backend does not need to be running.
