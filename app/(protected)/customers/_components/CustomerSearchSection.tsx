'use client';

import { useTranslation } from 'react-i18next';
import SearchBar from '@/src/components/SearchBar';

type Props = { mounted: boolean };

export default function CustomerSearchSection({ mounted }: Props) {
  const { t } = useTranslation();

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6">
      <h2 className="mb-2 text-sm font-semibold text-gray-900">
        {mounted ? t('quickSearch') : 'Quick search'}
      </h2>
      <SearchBar className="w-full" />
      <p className="mt-2 text-[11px] text-gray-500">
        {mounted ? t('searchByNameLastnameCity') : 'Search by name, last name, or city.'}
      </p>
    </div>
  );
}
