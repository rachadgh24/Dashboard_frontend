'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomerStore } from '@/store/customersState';
import { usePermissionsStore } from '@/store/permissionsState';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
import { type PageSizeChoice } from '@/lib/pageSizeOptions';
import { SkeletonCard } from '../../components/skeletons/Skeleton';

const CARS_API = `${API_BASE}/Cars`;

type Car = {
  id: number;
  model: string;
  maxSpeed: number;
  userId?: number;
  UserId?: number;
  customerId?: number;
  CustomerId?: number;
};

type Props = {
  mounted: boolean;
  itemsPerPage: PageSizeChoice;
  reloadKey: number;
  onCountChange: (count: number) => void;
};

export default function CarGridSection({ mounted, itemsPerPage, reloadKey, onCountChange }: Props) {
  const { t } = useTranslation();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canEdit = hasClaim('EditCar');
  const canDelete = hasClaim('DeleteCar');
  const customers = useCustomerStore((s) => s.customers);

  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editModel, setEditModel] = useState('');
  const [editMaxSpeed, setEditMaxSpeed] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const fetchPage = async (page: number) => {
    try {
      const [total, data] = await Promise.all([
        apiFetch<number>(`${CARS_API}/count`, { headers: getAuthHeaders() }),
        apiFetch<Car[]>(`${CARS_API}/paginate?page=${page}&pageSize=${itemsPerPage}`, { headers: getAuthHeaders() }),
      ]);
      onCountChange(total);
      setCars(data ?? []);
      const newTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      setTotalPages(newTotalPages);
      setCurrentPage(Math.min(page, newTotalPages));
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadCars'));
    }
  };

  useEffect(() => {
    setLoading(true);
    fetchPage(1).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemsPerPage]);

  useEffect(() => {
    if (loading) return;
    void fetchPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const goToPage = async (page: number) => {
    if (page < 1) return;
    setLoading(true);
    await fetchPage(page);
    setLoading(false);
  };

  if (error && !loading) {
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-5">
        <p className="text-red-600">{error}</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-900" suppressHydrationWarning>
          {mounted ? t('fleetOverview') : 'Fleet overview'}
        </h2>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} lines={2} />)
        ) : (
          <>
            {cars.map((car) => {
              const isEditing = editingId === car.id;
              const ownerId = car.customerId ?? car.CustomerId ?? car.userId ?? car.UserId;
              const owner = ownerId != null ? customers.find((c) => c.id === ownerId) : undefined;
              return (
                <div
                  key={car.id}
                  className="flex flex-col gap-3 rounded-xl border border-slate-200 bg-white p-4 text-sm text-black"
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-2">
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                        value={editModel}
                        onChange={(e) => setEditModel(e.target.value)}
                      />
                      <input
                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                        type="number"
                        value={editMaxSpeed}
                        onChange={(e) => setEditMaxSpeed(e.target.value)}
                      />
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-gray-900">{car.model}</span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700">
                          <span suppressHydrationWarning>
                            {owner ? `${owner.name} ${owner.lastName}` : mounted ? t('noOwner') : 'No owner'}
                          </span>
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        <span suppressHydrationWarning>{mounted ? t('maxSpeed') : 'Max speed'}</span>{' '}
                        <span className="font-semibold text-gray-800">{car.maxSpeed} km/h</span>
                      </p>
                    </>
                  )}

                  <div className="mt-2 flex items-center justify-end gap-2">
                    {isEditing ? (
                      canEdit && (
                        <>
                          <button
                            type="button"
                            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs text-white"
                            onClick={async () => {
                              const updated = await apiFetch<Car>(`${CARS_API}/${car.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
                                body: JSON.stringify({
                                  id: car.id,
                                  model: editModel.trim(),
                                  maxSpeed: Number(editMaxSpeed),
                                  customerId: car.customerId ?? car.CustomerId,
                                }),
                              });
                              setCars((prev) => prev.map((c) => (c.id === car.id ? updated : c)));
                              setEditingId(null);
                            }}
                          >
                            <span suppressHydrationWarning>{mounted ? t('save') : 'Save'}</span>
                          </button>
                          <button
                            type="button"
                            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                            onClick={() => setEditingId(null)}
                          >
                            <span suppressHydrationWarning>{mounted ? t('cancel') : 'Cancel'}</span>
                          </button>
                        </>
                      )
                    ) : (
                      canEdit && (
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                          onClick={() => {
                            setEditingId(car.id);
                            setEditModel(car.model);
                            setEditMaxSpeed(String(car.maxSpeed));
                          }}
                        >
                          <span suppressHydrationWarning>{mounted ? t('edit') : 'Edit'}</span>
                        </button>
                      )
                    )}
                    {canDelete && (
                      <button
                        type="button"
                        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs text-white"
                        onClick={async () => {
                          await apiFetch<null>(`${CARS_API}/${car.id}`, {
                            method: 'DELETE',
                            headers: getAuthHeaders(),
                          });
                          await fetchPage(currentPage);
                        }}
                      >
                        <span suppressHydrationWarning>{mounted ? t('delete') : 'Delete'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}

            {cars.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-gray-500">
                <span suppressHydrationWarning>{mounted ? t('noCarsYet') : 'No cars yet'}</span>
              </div>
            )}

            <div className="col-span-full mt-4 flex items-center justify-center gap-1 border-t border-slate-200 pt-4">
              <button
                type="button"
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                &#8249;
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`rounded px-2.5 py-1.5 text-sm ${p === currentPage ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                  onClick={() => goToPage(p)}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                disabled={currentPage >= totalPages}
                onClick={() => goToPage(currentPage + 1)}
              >
                &#8250;
              </button>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
