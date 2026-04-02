'use client';

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomerStore } from '@/store/customersState';
import { usePermissionsStore } from '@/store/permissionsState';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
import { PAGE_SIZE_OPTIONS, type PageSizeChoice } from '@/lib/pageSizeOptions';
import { Skeleton } from '../../components/skeletons/Skeleton';

const CARS_API = `${API_BASE}/Cars`;

type Car = {
  id: number;
  model: string;
  maxSpeed: number;
  customerId?: number;
};

type Props = {
  mounted: boolean;
  itemsPerPage: PageSizeChoice;
  onItemsPerPageChange: (v: PageSizeChoice) => void;
  recordTotal: number;
  onCreated: () => void;
};

export default function CreateCarSection({
  mounted,
  itemsPerPage,
  onItemsPerPageChange,
  recordTotal,
  onCreated,
}: Props) {
  const { t } = useTranslation();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canCreate = hasClaim('CreateCar');
  const { customers, fetchCustomers } = useCustomerStore();
  const [customersReady, setCustomersReady] = useState(customers.length > 0);

  const [model, setModel] = useState('');
  const [maxSpeed, setMaxSpeed] = useState('');
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  useEffect(() => {
    fetchCustomers().then(() => setCustomersReady(true));
  }, [fetchCustomers]);

  useEffect(() => {
    if (customers.length > 0) setCustomersReady(true);
  }, [customers]);

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!model.trim() || !maxSpeed.trim() || selectedUserId == null) return;
    await apiFetch<Car | { car?: Car }>(CARS_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({
        model: model.trim(),
        maxSpeed: Number(maxSpeed),
        customerId: selectedUserId,
      }),
    });
    setModel('');
    setMaxSpeed('');
    setSelectedUserId(null);
    onCreated();
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900" suppressHydrationWarning>
            {mounted ? t('cars') : 'Cars'}
          </h1>
          <p className="text-xs text-gray-500" suppressHydrationWarning>
            {mounted ? t('carsSubtitle') : 'Manage your cars.'}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-xs text-gray-600">
            <span suppressHydrationWarning>{mounted ? t('perPage') : 'Per page'}</span>
            <select
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:ring-0"
              value={itemsPerPage}
              onChange={(e) => onItemsPerPageChange(Number(e.target.value) as PageSizeChoice)}
            >
              {PAGE_SIZE_OPTIONS.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </label>
          <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
            <span suppressHydrationWarning>
              {mounted ? t('inTotal', { count: recordTotal }) : `${recordTotal} total`}
            </span>
          </span>
        </div>
      </div>

      {mounted && canCreate && !customersReady ? (
        <div className="space-y-3">
          <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <Skeleton className="h-9 w-full rounded-lg" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <Skeleton className="h-9 w-full rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      ) : (
        mounted && canCreate && (
          <form className="flex flex-col gap-2" onSubmit={handleCreate}>
            <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                placeholder={mounted ? t('model') : 'Model'}
                value={model}
                onChange={(e) => setModel(e.target.value)}
              />
              <input
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                placeholder={mounted ? t('maxSpeedKmh') : 'Max speed'}
                type="number"
                value={maxSpeed}
                onChange={(e) => setMaxSpeed(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                <span suppressHydrationWarning>{mounted ? t('owner') : 'Owner'}</span>
              </label>
              <select
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                value={selectedUserId ?? ''}
                onChange={(e) => {
                  const v = e.target.value;
                  setSelectedUserId(v === '' ? null : Number(v));
                }}
              >
                <option value="" suppressHydrationWarning>
                  {mounted ? t('selectCustomer') : 'Select customer'}
                </option>
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
              <span suppressHydrationWarning>{mounted ? t('addCar') : 'Add car'}</span>
            </button>
          </form>
        )
      )}
    </section>
  );
}
