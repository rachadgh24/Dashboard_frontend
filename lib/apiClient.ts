export type ApiResponse<T> =
  | { data: T; error?: never }
  | { data?: never; error: { code: string; message: string } };

export async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  let body: ApiResponse<T>;
  try {
    body = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new Error(res.ok ? 'Invalid response' : 'Request failed');
  }
  if (body.error) {
    throw new Error(body.error.message);
  }
  if (!res.ok) {
    throw new Error((body as { error?: { message: string } }).error?.message ?? 'Request failed');
  }
  return body.data as T;
}
