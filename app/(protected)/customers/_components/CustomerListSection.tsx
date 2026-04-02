'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocale } from '@/components/I18nProvider';
import Link from 'next/link';
import { FaUserCircle, FaEye, FaTrash, FaChevronDown, FaChevronLeft, FaChevronRight, FaCar } from 'react-icons/fa';
import { useCustomerStore, type Customer } from '@/store/customersState';
import { usePermissionsStore } from '@/store/permissionsState';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
import { DEFAULT_PAGE_SIZE, PAGE_SIZE_OPTIONS, type PageSizeChoice } from '@/lib/pageSizeOptions';
import { SkeletonRow } from '../../components/skeletons/Skeleton';
import { isFresh, markFresh, prefetchData, getCachedData } from '@/lib/prefetch';

type Props = {
  reloadKey: number;
  mounted: boolean;
  onCountChange: (count: number) => void;
};

export default function CustomerListSection({ reloadKey, mounted, onCountChange }: Props) {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canView = hasClaim('ViewCustomer');
  const canDelete = hasClaim('DeleteCustomer');

  const filteredCustomers = useCustomerStore((s) => s.filteredCustomers);
  const query = useCustomerStore((s) => s.query);
  const fetchCustomersPaginate = useCustomerStore((s) => s.fetchCustomersPaginate);
  const setSelectedCustomer = useCustomerStore((s) => s.setSelectedCustomer);
  const deleteCustomer = useCustomerStore((s) => s.deleteCustomer);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCustomerIds, setExpandedCustomerIds] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState<PageSizeChoice>(DEFAULT_PAGE_SIZE);
  const [totalPages, setTotalPages] = useState(1);
  const [sortBy, setSortBy] = useState<string | null>(null);

  const isFirstLoad = useRef(true);

  const getAuthHeaders = () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  };

  const fetchPage = async (page: number, useCache = false) => {
    setError(null);
    try {
      const total = await apiFetch<number>(`${API_BASE}/Customers/count`, { headers: getAuthHeaders() });
      const newTotalPages = Math.max(1, Math.ceil(total / itemsPerPage));
      const safePage = Math.min(page, newTotalPages);

      const cacheKey = `customers-page-${safePage}-${itemsPerPage}-${sortBy}`;
      const cached = useCache ? getCachedData<Customer[]>(cacheKey) : null;

      if (cached && safePage === page) {
        useCustomerStore.setState({
          customers: cached,
          filteredCustomers: cached,
        });
      } else {
        await fetchCustomersPaginate(safePage, itemsPerPage, sortBy ?? undefined);
      }

      onCountChange(total);
      setCurrentPage(safePage);
      setTotalPages(newTotalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('failedToLoadCustomers'));
    }
  };

  useEffect(() => {
    const init = async () => {
      if (isFirstLoad.current && isFresh('customers-page-1')) {
        setLoading(false);
        isFirstLoad.current = false;
        return;
      }
      const first = isFirstLoad.current;
      if (first) setLoading(true);
      await fetchPage(1);
      markFresh('customers-page-1');
      if (first) {
        setLoading(false);
        isFirstLoad.current = false;
      }
    };
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortBy, itemsPerPage]);

  useEffect(() => {
    if (isFirstLoad.current) return;
    void fetchPage(currentPage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reloadKey]);

  const toggleExpanded = (id: number) => {
    setExpandedCustomerIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const formatValue = (value: unknown) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string') return value;
    if (typeof value === 'number' || typeof value === 'boolean' || typeof value === 'bigint')
      return String(value);
    try { return JSON.stringify(value); } catch { return String(value); }
  };

  const hoverTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const onPaginationHover = useCallback((page: number) => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
    hoverTimerRef.current = setTimeout(() => {
      const key = `customers-page-${page}-${itemsPerPage}-${sortBy}`;
      const params = new URLSearchParams({ page: String(page), pageSize: String(itemsPerPage) });
      if (sortBy) params.set('sortBy', sortBy);
      prefetchData<Customer[]>(key, () =>
        apiFetch<Customer[]>(`${API_BASE}/Customers/paginate?${params.toString()}`, {
          cache: 'no-store',
          headers: getAuthHeaders(),
        }),
      );
    }, 300);
  }, [itemsPerPage, sortBy]);

  const onPaginationLeave = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current);
  }, []);

  const handleDelete = async (id: number) => {
    await deleteCustomer(id);
    await fetchPage(currentPage);
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
                <option key={n} value={n}>{n}</option>
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
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
        ) : (
          <>
            {filteredCustomers.map((customer: Customer) => {
              const isExpanded = expandedCustomerIds.includes(customer.id);
              const customerCars = customer.cars ?? [];
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
                        <span className="font-semibold text-gray-800">{customer.name}</span>
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
                              <span className="font-medium text-gray-800">{car.model}</span>
                              <span className="text-xs text-gray-600">{car.maxSpeed} km/h</span>
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
                  onClick={() => fetchPage(currentPage - 1, true)}
                  onMouseEnter={() => currentPage > 1 && onPaginationHover(currentPage - 1)}
                  onMouseLeave={onPaginationLeave}
                >
                  &#8249;
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    type="button"
                    className={`rounded px-2.5 py-1.5 text-sm ${p === currentPage ? 'bg-slate-900 text-white' : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'}`}
                    onClick={() => fetchPage(p, true)}
                    onMouseEnter={() => p !== currentPage && onPaginationHover(p)}
                    onMouseLeave={onPaginationLeave}
                  >
                    {p}
                  </button>
                ))}
                <button
                  type="button"
                  className="rounded border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 disabled:opacity-50"
                  disabled={currentPage >= totalPages}
                  onClick={() => fetchPage(currentPage + 1, true)}
                  onMouseEnter={() => currentPage < totalPages && onPaginationHover(currentPage + 1)}
                  onMouseLeave={onPaginationLeave}
                >
                  &#8250;
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
