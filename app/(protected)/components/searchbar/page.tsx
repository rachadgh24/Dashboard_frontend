// components/SearchBar.tsx
'use client';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiSearch } from 'react-icons/fi';
import { filterByQuery } from '@/lib/searchUtils';

interface SearchBarProps {
  data?: string[]; // array to search
}

export default function SearchBar({ data = [] }: SearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');

  const filtered = filterByQuery(data, query);

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="flex items-center border p-2 rounded">
        <FiSearch className="me-2" />
        <input
          type="text"
          placeholder={t('searchPlaceholder')}
          className="flex-1 outline-none"
          value={query}
          onChange={e => setQuery(e.target.value)}
        />
      </div>

          <div className="mt-2">
              
        {filtered.map(item => (
          <div      key={item} className="p-1 border-b">
     {item}
                 </div>
        ))}
      </div>
    </div>
  );
}