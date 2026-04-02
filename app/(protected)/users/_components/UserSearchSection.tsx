'use client';

import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';
import { useUserStore } from '@/store/usersState';

export default function UserSearchSection() {
  const { t } = useTranslation();
  const query = useUserStore((s) => s.query);
  const setQuery = useUserStore((s) => s.setQuery);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">
        {t('quickSearch')}
      </h2>
      <div className="flex rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
        <FiSearch className="me-2 shrink-0 text-slate-500" />
        <input
          type="text"
          placeholder={t('searchUsersPlaceholder')}
          className="flex-1 bg-transparent text-sm text-slate-900 outline-none placeholder:text-slate-400"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
    </div>
  );
}
