import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { getUserRole, useIsAdmin } from '@/lib/useUserRole';

function makeToken(payload: Record<string, unknown>) {
  const json = JSON.stringify(payload);
  const base64 = btoa(json).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `h.${base64}.s`;
}

describe('getUserRole', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('returns admin for role claim string', () => {
    // Why: tokens encode role as a string claim; navigation gates depend on parsing it.
    localStorage.setItem('token', makeToken({ role: 'Admin' }));
    expect(getUserRole()).toBe('admin');
  });

  it('returns generalmanager when claim uses spaced display name', () => {
    // Why: backend may emit display names with spaces; normalizer must collapse them.
    localStorage.setItem('token', makeToken({ role: 'General Manager' }));
    expect(getUserRole()).toBe('generalmanager');
  });

  it('reads first matching role from claim array', () => {
    // Why: some issuers send multiple role claims as an array.
    localStorage.setItem('token', makeToken({ role: ['Social Media Manager', 'Admin'] }));
    expect(getUserRole()).toBe('socialmediamanager');
  });

  it('returns null when token missing', () => {
    // Why: logged-out users must not be treated as privileged.
    expect(getUserRole()).toBeNull();
  });
});

describe('useIsAdmin', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('resolves to true for admin token', async () => {
    // Why: hook avoids redirect race by starting null then settling to a boolean.
    localStorage.setItem('token', makeToken({ role: 'Admin' }));

    const { result } = renderHook(() => useIsAdmin());

    await waitFor(() => {
      expect(result.current).toBe(true);
    });
  });
});
