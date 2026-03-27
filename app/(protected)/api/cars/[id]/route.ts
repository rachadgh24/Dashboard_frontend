import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';

const CARS_API = `${API_BASE}/Cars`;

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const data = await apiFetch<unknown>(`${CARS_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return Response.json({ data });
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await apiFetch<null>(`${CARS_API}/${id}`, { method: 'DELETE' });
  return Response.json({ data: null });
}
