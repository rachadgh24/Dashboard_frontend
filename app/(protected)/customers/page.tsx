'use client';

import { useEffect, useState } from 'react';
import { usePermissionsStore } from '@/store/permissionsState';
import { Skeleton, SkeletonRow } from '../components/skeletons/Skeleton';
import CreateCustomerSection from './_components/CreateCustomerSection';
import CustomerSearchSection from './_components/CustomerSearchSection';
import CustomerListSection from './_components/CustomerListSection';

export default function CustomersPage() {
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canSearchCustomers = hasClaim('SearchCustomers');
  const [mounted, setMounted] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  const triggerReload = () => setReloadKey((k) => k + 1);

  return (
    <main className="min-h-full bg-transparent">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <section className="grid gap-6 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <CreateCustomerSection
            onCreated={triggerReload}
            totalRecords={totalRecords}
            mounted={mounted}
          />
          {mounted && canSearchCustomers && <CustomerSearchSection mounted={mounted} />}
        </section>

        <CustomerListSection
          reloadKey={reloadKey}
          mounted={mounted}
          onCountChange={setTotalRecords}
        />
      </div>
    </main>
  );
}
