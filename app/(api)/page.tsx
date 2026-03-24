import { apiFetch } from '@/lib/apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';

export default async function Page() {
  const data = await apiFetch<unknown>(`${API_BASE}/Customers`, { cache: 'no-store' });
  return (
    <main className="p-6">
      <h1 className="mb-3 text-lg font-semibold">Customers (debug)</h1>
      <pre className="whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-4 text-xs text-slate-800">
        {JSON.stringify(data, null, 2)}
      </pre>
    </main>
  );
}
