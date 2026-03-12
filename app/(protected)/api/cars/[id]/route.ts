const CARS_API = 'https://localhost:7190/Cars';

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await request.json();
  const res = await fetch(`${CARS_API}/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error('Failed to update car');
  const data = await res.json();
  return Response.json(data);
}

export async function DELETE(
  _: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const res = await fetch(`${CARS_API}/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete car');
  return new Response(null, { status: 204 });
}
