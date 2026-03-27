'use client';
import { FaUserCircle, FaEye, FaTrash, FaChevronDown, FaChevronLeft, FaChevronRight, FaCar } from 'react-icons/fa';
import { useEffect, useRef, useState, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/components/I18nProvider';
import SearchBar from '@/src/components/SearchBar';
import type { Customer } from '../../../store/customersState';
import Link from 'next/link';
import { useCustomerStore } from '../../../store/customersState';
import type { CreateCustomerPayload } from '../../../store/customersState';

import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, type PageSizeChoice } from '@/lib/pageSizeOptions';
import { usePermissionsStore } from '@/store/permissionsState';

export default function CustomersPage() {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const [mounted, setMounted] = useState(false);
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canCreate = hasClaim('CreateCustomer');
  const canView = hasClaim('ViewCustomer');
  const canDelete = hasClaim('DeleteCustomer');
  const canSearchCustomers = hasClaim('SearchCustomers');
  const filteredCustomers = useCustomerStore((state) => state.filteredCustomers);
  const query = useCustomerStore((state) => state.query);
  const fetchCustomersPaginate = useCustomerStore((state) => state.fetchCustomersPaginate);
  const setSelectedCustomer = useCustomerStore((state) => state.setSelectedCustomer);
  const createCustomer = useCustomerStore((state) => state.createCustomer);
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<PageSizeChoice>(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const isFirstLoad = useRef(true);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const init = async () => {
      const first = isFirstLoad.current;
      if (first) setLoading(true);
      setError(null);
      try {
        const total = await apiFetch<number>(`${API_BASE}/Customers/count`, { headers: getAuthHeaders() });
        await fetchCustomersPaginate(1, itemsPerPage, sortBy ?? undefined);
        setTotalRecords(total);
        setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
        setCurrentPage(1);
      } catch (err) {
        setError(err instanceof Error ? err.message : t('failedToLoadCustomers'));
      } finally {
        if (first) {
          setLoading(false);
          isFirstLoad.current = false;
        }
      }
    };
    init();
  }, [fetchCustomersPaginate, sortBy, itemsPerPage]);

  const toggleExpanded = (customerId: number) => {
    setExpandedCustomerIds((prev) =>
      prev.includes(customerId) ? prev.filter((id) => id !== customerId) : [...prev, customerId]
    );
  };

  const getCarsForCustomer = (customer: Customer) => customer.cars ?? [];

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (
      typeof value === 'number' ||
      typeof value === 'boolean' ||
      typeof value === 'bigint'
    )
      return String(value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  };

  const goToPage = async (page: number) => {
    if (page < 1) return;
    setError(null);
    try {
      const total = await apiFetch<number>(`${API_BASE}/Customers/count`, { headers: getAuthHeaders() });
      const newTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      const safePage = Math.min(page, newTotalPages);
      await fetchCustomersPaginate(safePage, itemsPerPage, sortBy ?? undefined);
      setTotalRecords(total);
      setCurrentPage(safePage);
      setTotalPages(newTotalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadCustomers'));
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !lastName.trim() || !city.trim() || !email.trim()) return;

    const payload: CreateCustomerPayload = {
      name: name.trim(),
      lastName: lastName.trim(),
      city: city.trim(),
      email: email.trim(),
    };
    await createCustomer(payload);
    setName('');
    setLastName('');
    setCity('');
    setEmail('');
    await goToPage(currentPage);
  };

  const handleDelete = async (id: number) => {
    await deleteCustomer(id);
    await goToPage(currentPage);
  };

  if (loading) {
    return <main className="text-slate-800">{mounted ? t('loadingCustomers') : 'Loading customers...'}</main>;
  }

  if (error) {
    return <main className="text-red-600">{error}</main>;
  }

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {mounted ? t('customers') : 'Customers'}
                </h1>
                <p className="text-xs text-gray-500">
                  {mounted ? t('customersSubtitle') : 'Manage your customers and basic details.'}
                </p>
              </div>
              <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700">
                {mounted
                  ? t('totalCount', { count: !query.trim() ? totalRecords : filteredCustomers.length })
                  : `${!query.trim() ? totalRecords : filteredCustomers.length} total`}
              </span>
            </div>

            {canCreate && (
            <form
              onSubmit={handleCreate}
              className="flex flex-col gap-2"
            >
              <div className="grid gap-2 md:grid-cols-3">
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={mounted ? t('name') : 'Name'}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={mounted ? t('lastName') : 'Last name'}
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <input
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={mounted ? t('city') : 'City'}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <input
                  type="email"
                  className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-black focus:border-slate-400 focus:ring-0"
                  placeholder={mounted ? t('email') : 'Email'}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <button
                type="submit"
                className="mt-2 inline-flex items-center justify-center rounded-lg bg-slate-900 px-3 py-2 text-xs font-medium text-white hover:bg-slate-800"
              >
                {mounted ? t('createCustomer') : 'Create customer'}
              </button>
            </form>
            )}
          </div>

          {canSearchCustomers && (
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="mb-2 text-sm font-semibold text-gray-900">
              {mounted ? t('quickSearch') : 'Quick search'}
            </h2>
            <SearchBar className="w-full" />
            <p className="mt-2 text-[11px] text-gray-500">
              {mounted ? t('searchByNameLastnameCity') : 'Search by name, last name, or city.'}
            </p>
          </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-gray-900">
              {mounted ? t('allCustomers') : 'All customers'}
            </h2>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <span>{mounted ? t('perPage') : 'Per page'}</span>
                <select
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:ring-0"
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value) as PageSizeChoice)}
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-2 text-xs text-gray-600">
                <span>{mounted ? t('sortBy') : 'Sort by'}</span>
                <select
                  className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm text-slate-800 focus:border-slate-400 focus:ring-0"
                  value={sortBy ?? ''}
                  onChange={(e) => setSortBy(e.target.value || null)}
                >
                  <option value="">{mounted ? t('sortDefault') : 'Default'}</option>
                  <option value="LeastCars">{mounted ? t('sortByLeastCars') : 'Least cars'}</option>
                  <option value="MostCars">{mounted ? t('sortByMostCars') : 'Most cars'}</option>
                  <option value="CarName">{mounted ? t('sortByCarName') : 'Car name'}</option>
                  <option value="OwnerName">{mounted ? t('sortByOwnerName') : 'Owner name'}</option>
                </select>
              </label>
            </div>
          </div>

          <div className="space-y-3">
            {filteredCustomers.map((customer: Customer) => {
              const isExpanded = expandedCustomerIds.includes(customer.id);
              const customerCars = getCarsForCustomer(customer);
              return (
                <div
                  key={customer.id}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-white"
                >
                  <div
                    className="flex cursor-pointer flex-row items-center gap-3 px-4 py-3 text-sm transition-colors hover:bg-slate-50"
                    onClick={() => toggleExpanded(customer.id)}
                  >
                    <button
                      type="button"
                      className="p-0.5 text-gray-500 hover:text-gray-700"
                      aria-label={isExpanded ? (mounted ? t('collapse') : 'Collapse') : (mounted ? t('expand') : 'Expand')}
                    >
                      {isExpanded ? (
                        <FaChevronDown size={16} />
                      ) : locale === 'ar' ? (
                        <FaChevronLeft size={16} />
                      ) : (
                        <FaChevronRight size={16} />
                      )}
                    </button>
                    <FaUserCircle className="text-gray-500 shrink-0" size={22} />

                    <div className="flex-1 min-w-0 grid gap-0.5 md:grid-cols-3 text-xs md:text-sm">
                      <div className="truncate">
                        <span className="font-semibold text-gray-800">
                          {customer.name}
                        </span>
                        <span className="text-gray-500"> {customer.lastName}</span>
                      </div>
                      <div className="truncate text-gray-700">
                        <span className="font-semibold text-gray-500">{mounted ? t('cityLabel') : 'City:'} </span>
                        {formatValue(customer.city)}
                      </div>
                      <div className="truncate text-gray-500 text-xs md:text-sm">
                        ID: {customer.id}
                      </div>
                    </div>

                    <div
                      className="flex items-center gap-2 shrink-0"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {canView && (
                      <Link
                        href={`/customers/${customer.id}`}
                        className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <FaEye size={14} className="me-1" />
                        {mounted ? t('view') : 'View'}
                      </Link>
                      )}
                      {canDelete && (
                      <button
                        type="button"
                        className="inline-flex items-center justify-center rounded-lg border border-red-200 bg-white px-2.5 py-1.5 text-xs text-red-600 hover:bg-red-50"
                        onClick={() => handleDelete(customer.id)}
                      >
                        <FaTrash size={12} className="me-1" />
                        {mounted ? t('delete') : 'Delete'}
                      </button>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
                      <h3 className="text-xs font-semibold text-gray-600 mb-2 flex items-center gap-1.5">
                        <FaCar size={12} />
                        {mounted ? t('carsCount', { count: customerCars.length }) : `Cars (${customerCars.length})`}
                      </h3>
                      {customerCars.length === 0 ? (
                        <p className="text-xs text-gray-500 py-2">
                          {mounted ? t('noCarsForCustomer') : 'No cars for this customer.'}
                        </p>
                      ) : (
                        <ul className="space-y-2">
                          {customerCars.map((car) => (
                            <li
                              key={car.id}
                              className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-gray-800">
                                {car.model}
                              </span>
                              <span className="text-xs text-gray-600">
                                {car.maxSpeed} km/h
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            {filteredCustomers.length === 0 && (
              <div className="py-6 text-center text-xs text-gray-500">
                {mounted ? t('noCustomersMatchFilters') : 'No customers match your current filters.'}
              </div>
            )}

            {!query.trim() && (
              <div className="mt-4 flex items-center justify-center gap-1 border-t border-slate-200 pt-4">
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
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
