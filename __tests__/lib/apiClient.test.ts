import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { apiFetch } from '@/lib/apiClient';
import { server } from '@/__tests__/mocks/server';

describe('apiFetch', () => {
  it('returns data from ApiResponse wrapper on success', async () => {
    // Why: backend wraps payloads in { data }; client must unwrap to match .NET DTO usage.
    server.use(
      http.get('http://api.test/sample', () =>
        HttpResponse.json({ data: { id: 1, name: 'x' } }),
      ),
    );

    const result = await apiFetch<{ id: number; name: string }>('http://api.test/sample');

    expect(result).toEqual({ id: 1, name: 'x' });
  });

  it('throws with error message when body contains error object', async () => {
    // Why: API errors use { error: { code, message } }; callers rely on message text.
    server.use(
      http.get('http://api.test/bad', () =>
        HttpResponse.json(
          { error: { code: 'X', message: 'Not allowed' } },
          { status: 400 },
        ),
      ),
    );

    await expect(apiFetch('http://api.test/bad')).rejects.toThrow('Not allowed');
  });

  it('throws when response is not ok and JSON has no usable error', async () => {
    // Why: defensive path for malformed error payloads on HTTP failures.
    server.use(
      http.get('http://api.test/nope', () => new HttpResponse('', { status: 500 })),
    );

    await expect(apiFetch('http://api.test/nope')).rejects.toThrow('Request failed');
  });
});
