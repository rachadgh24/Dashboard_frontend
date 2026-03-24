'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomerStore } from '@/store/customersState';
import { apiFetch } from '@/lib/apiClient';
import { usePermissionsStore } from '@/store/permissionsState';

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';
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

export default function SalesPage() {
  const { t } = useTranslation();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canCreate = hasClaim('CreateCar');
  const canEdit = hasClaim('EditCar');
  const canDelete = hasClaim('DeleteCar');
  const { customers, fetchCustomers } = useCustomerStore();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [model, setModel] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editModel, setEditModel] = useState('');
  const [editMaxSpeed, setEditMaxSpeed] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    const init = async () => {
      try {
        const [total, data] = await Promise.all([
          apiFetch<number>(`${CARS_API}/count`, { headers: getAuthHeaders() }),
          apiFetch<Car[]>(`${CARS_API}/paginate?page=1`, { headers: getAuthHeaders() }),
        ]);
        const ps = data.length || 1;
        setPageSize(ps);
        setCars(data);
        setTotalPages(Math.max(1, Math.ceil(total / ps)));
      } catch (err) {
        console.error('Error fetching cars', err);
        setError(err instanceof Error ? err.message : t('failedToLoadCars'));
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const goToPage = async (page: number) => {
    if (page < 1) return;
    setLoading(true);
    try {
      const [total, data] = await Promise.all([
        apiFetch<number>(`${CARS_API}/count`, { headers: getAuthHeaders() }),
        apiFetch<Car[]>(`${CARS_API}/paginate?page=${page}`, { headers: getAuthHeaders() }),
      ]);
      const newTotalPages = Math.max(1, Math.ceil(total / pageSize));
      const safePage = Math.min(page, newTotalPages);
      if (safePage < page) {
        const safeData = await apiFetch<Car[]>(`${CARS_API}/paginate?page=${safePage}`, { headers: getAuthHeaders() });
        setCars(safeData ?? []);
        setCurrentPage(safePage);
      } else {
        setCars(data);
        setCurrentPage(page);
      }
      setTotalPages(newTotalPages);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <main className="text-slate-800">Loading cars...</main>;
  }

  if (error) {
    return <main className="text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-lg font-semibold text-gray-900">{t('cars')}</h1>
              <p className="text-xs text-gray-500">
                {t('carsSubtitle')}
              </p>
            </div>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
              {t('inTotal', { count: cars.length })}
            </span>
          </div>

          {canCreate && (
          <form
            className="flex flex-col gap-2"
            onSubmit={async (e) => {
              e.preventDefault();
              if (!model.trim() || !maxSpeed.trim() || selectedUserId == null)
                return;
              await apiFetch<Car | { car?: Car }>(CARS_API, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  ...getAuthHeaders(),
                },
                body: JSON.stringify({
                  model: model.trim(),
                  maxSpeed: Number(maxSpeed),
                  customerId: selectedUserId,
                }),
              });
              setModel('');
              setMaxSpeed('');
              setSelectedUserId(null);
              await goToPage(currentPage);
            }}
          >
            <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                placeholder={t('model')}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                placeholder={t('maxSpeedKmh')}
                type="number"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                {t('owner')}
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                value={selectedUserId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedUserId(v === '' ? null : Number(v));
                }}
              >
                <option value="">{t('selectCustomer')}</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.lastName}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={selectedUserId == null}
            >
              {t('addCar')}
            </button>
          </form>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {t('fleetOverview')}
            </h2>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
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
                        <span className="font-semibold text-gray-900">
                          {car.model}
                        </span>
                        <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-sm font-semibold text-slate-700">
                          {owner ? `${owner.name} ${owner.lastName}` : t('noOwner')}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600">
                        {t('maxSpeed')}{' '}
                        <span className="font-semibold text-gray-800">
                          {car.maxSpeed} km/h
                        </span>
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
                              headers: {
                                'Content-Type': 'application/json',
                                ...getAuthHeaders(),
                              },
                              body: JSON.stringify({
                                id: car.id,
                                model: editModel.trim(),
                                maxSpeed: Number(editMaxSpeed),
                                customerId: car.customerId ?? car.CustomerId,
                              }),
                            });
                            setCars((prev) =>
                              prev.map((c) => (c.id === car.id ? updated : c)),
                            );
                            setEditingId(null);
                          }}
                        >
                          {t('save')}
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-800"
                          onClick={() => setEditingId(null)}
                        >
                          {t('cancel')}
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
                        {t('edit')}
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
                        await goToPage(currentPage);
                      }}
                    >
                      {t('delete')}
                    </button>
                    )}
                  </div>
                </div>
              );
            })}

            {cars.length === 0 && (
              <div className="col-span-full py-6 text-center text-xs text-gray-500">
                {t('noCarsYet')}
              </div>
            )}

            <div className="col-span-full mt-4 flex items-center justify-center gap-1 border-t border-slate-200 pt-4">
              <button
                type="button"
                className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                disabled={currentPage <= 1}
                onClick={() => goToPage(currentPage - 1)}
              >
                ‹
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
                ›
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
