'use client';

import { useEffect, useState } from 'react';
import { DEFAULT_PAGE_SIZE, type PageSizeChoice } from '@/lib/pageSizeOptions';
import CreateCarSection from './_components/CreateCarSection';
import CarGridSection from './_components/CarGridSection';

export default function SalesPage() {
  const [mounted, setMounted] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState<PageSizeChoice>(DEFAULT_PAGE_SIZE);
  const [recordTotal, setRecordTotal] = useState(0);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    setMounted(true);
  }, []);

  const triggerReload = () => setReloadKey((k) => k + 1);

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <CreateCarSection
          mounted={mounted}
          itemsPerPage={itemsPerPage}
          onItemsPerPageChange={setItemsPerPage}
          recordTotal={recordTotal}
          onCreated={triggerReload}
        />
        <CarGridSection
          mounted={mounted}
          itemsPerPage={itemsPerPage}
          reloadKey={reloadKey}
          onCountChange={setRecordTotal}
        />
      </div>
    </main>
  );
}
