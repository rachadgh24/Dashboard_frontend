'use client';

import {
  DndContext,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
  type UniqueIdentifier,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { apiFetch } from '@/lib/apiClient';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';
const CLAIMS_API = `${API_BASE}/Claims`;
const ROLES_API = `${API_BASE}/Roles`;

const getAuthHeaders = () => {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  return headers;
};

type ClaimDto = { id: number; name: string; category: string };

type ContainerId = 'available' | 'selected';

function DroppableColumn({
  id,
  children,
}: {
  id: ContainerId;
  children: React.ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      data-droppable={id}
      className={isOver ? 'rounded-xl ring-2 ring-slate-300' : undefined}
    >
      {children}
    </div>
  );
}

function ClaimCard({ claim, containerId }: { claim: ClaimDto; containerId: ContainerId }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: claim.id,
    data: { containerId },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="cursor-grab rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-800 hover:bg-slate-50 active:cursor-grabbing"
    >
      <div className="font-semibold">{claim.name}</div>
      <div className="text-[11px] text-slate-500">{claim.category}</div>
    </div>
  );
}

export default function NewRolePage() {
  const router = useRouter();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [roleName, setRoleName] = useState('');
  const [available, setAvailable] = useState<ClaimDto[]>([]);
  const [selected, setSelected] = useState<ClaimDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await apiFetch<ClaimDto[]>(CLAIMS_API, { cache: 'no-store', headers: getAuthHeaders() });
        setAvailable(data ?? []);
        setSelected([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load claims');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const availableItems = useMemo<UniqueIdentifier[]>(() => available.map((c) => c.id), [available]);
  const selectedItems = useMemo<UniqueIdentifier[]>(() => selected.map((c) => c.id), [selected]);

  const categoryOrder = ['Users', 'Customers', 'Cars', 'Posts', 'Dashboard', 'Notifications'];
  const byCategory = useMemo(() => {
    const map = new Map<string, ClaimDto[]>();
    for (const c of available) {
      const cat = c.category || 'Other';
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(c);
    }
    for (const list of map.values()) list.sort((a, b) => a.name.localeCompare(b.name));
    return map;
  }, [available]);

  const sortedCategories = useMemo(() => {
    const seen = new Set(categoryOrder);
    const ordered: string[] = [];
    for (const cat of categoryOrder) if (byCategory.has(cat)) ordered.push(cat);
    for (const cat of byCategory.keys()) if (!seen.has(cat)) ordered.push(cat);
    return ordered;
  }, [byCategory]);

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(() => new Set());
  const toggleCategory = (category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };
  // keep categories collapsed by default

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;

    const fromContainer = (active.data.current?.containerId ?? null) as ContainerId | null;
    const toContainer = ((over.data.current?.containerId ?? over.id) as ContainerId | UniqueIdentifier | null);
    const fromId = Number(active.id);

    if (!fromId || !fromContainer) return;
    if (toContainer !== 'available' && toContainer !== 'selected') return;
    if (fromContainer === toContainer) return;

    if (fromContainer === 'available' && toContainer === 'selected') {
      const item = available.find((c) => c.id === fromId);
      if (!item) return;
      setAvailable((prev) => prev.filter((c) => c.id !== fromId));
      setSelected((prev) => [...prev, item]);
      return;
    }

    if (fromContainer === 'selected' && toContainer === 'available') {
      const item = selected.find((c) => c.id === fromId);
      if (!item) return;
      setSelected((prev) => prev.filter((c) => c.id !== fromId));
      setAvailable((prev) => [...prev, item].sort((a, b) => (a.category + a.name).localeCompare(b.category + b.name)));
    }
  };

  const removeSelected = (id: number) => {
    const item = selected.find((c) => c.id === id);
    if (!item) return;
    setSelected((prev) => prev.filter((c) => c.id !== id));
    setAvailable((prev) => [...prev, item].sort((a, b) => (a.category + a.name).localeCompare(b.category + b.name)));
  };

  const handleSave = async () => {
    const name = roleName.trim();
    if (!name) {
      setError('Role name is required');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const created = await apiFetch<{ id: number }>(ROLES_API, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name }),
      });

      await apiFetch<null>(`${ROLES_API}/${created.id}/claims`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ claimIds: selected.map((c) => c.id) }),
      });

      router.push('/users');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to create role');
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">New role</h1>
            <p className="text-xs text-gray-500">Drag claims from left to right, then save.</p>
          </div>
          <Link href="/users" className="text-xs text-slate-700 hover:underline">
            Back to users
          </Link>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <label className="mb-1 block text-xs font-medium text-gray-600">Role name</label>
          <input
            className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="e.g. Sales Manager"
          />
        </section>

        {error && (
          <section className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">{error}</section>
        )}

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <section className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">All claims</h2>
                <span className="text-xs text-slate-500">{available.length}</span>
              </div>

              {loading ? (
                <div className="text-xs text-slate-600">Loading…</div>
              ) : (
                <DroppableColumn id="available">
                  <SortableContext items={availableItems} strategy={verticalListSortingStrategy}>
                    <div className="space-y-1">
                      {available.length === 0 && <div className="text-xs text-slate-500">No claims.</div>}
                      {sortedCategories.map((category) => {
                        const claims = byCategory.get(category) ?? [];
                        const isExpanded = expandedCategories.has(category);
                        return (
                          <div key={category} className="rounded-lg border border-slate-200 overflow-hidden">
                            <button
                              type="button"
                              onClick={() => toggleCategory(category)}
                              className="flex w-full items-center justify-between gap-2 bg-slate-50 px-3 py-2.5 text-left text-sm font-semibold text-slate-800 hover:bg-slate-100"
                            >
                              <span>{category}</span>
                              <span className="text-slate-500">
                                {isExpanded ? <FaChevronDown size={14} /> : <FaChevronRight size={14} />}
                              </span>
                            </button>
                            {isExpanded && (
                              <div className="border-t border-slate-200 bg-white p-2 space-y-2">
                                {claims.map((c) => (
                                  <ClaimCard key={c.id} claim={c} containerId="available" />
                                ))}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </SortableContext>
                </DroppableColumn>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-900">Selected claims</h2>
                <span className="text-xs text-slate-500">{selected.length}</span>
              </div>

              <DroppableColumn id="selected">
                <SortableContext items={selectedItems} strategy={verticalListSortingStrategy}>
                  <div className="space-y-2">
                    {selected.map((c) => (
                      <div key={c.id} className="flex items-center gap-2">
                        <div className="flex-1">
                          <ClaimCard claim={c} containerId="selected" />
                        </div>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 px-2 py-1 text-xs text-slate-700 hover:bg-slate-50"
                          onClick={() => removeSelected(c.id)}
                          title="Remove"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    {selected.length === 0 && (
                      <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4 text-xs text-slate-600">
                        Drag claims here.
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DroppableColumn>
            </div>
          </section>
        </DndContext>

        <div className="flex justify-end">
          <button
            type="button"
            disabled={saving || loading}
            onClick={handleSave}
            className="inline-flex items-center justify-center rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Save role'}
          </button>
        </div>
      </div>
    </main>
  );
}

