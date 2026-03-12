'use client';

import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';
import { useCustomerStore } from '@/store/customersState';

export default function SearchBar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const query = useCustomerStore((state) => state.query);
  const setQuery = useCustomerStore((state) => state.setQuery);
  const searchCustomers = useCustomerStore((state) => state.searchCustomers);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      searchCustomers(query).catch((error) => {
        console.error('Failed to search customers', error);
      });
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [query, searchCustomers]);

  return (
    <div className={className}>
      <div className="flex items-center rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <FiSearch className="me-2 text-slate-500" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
