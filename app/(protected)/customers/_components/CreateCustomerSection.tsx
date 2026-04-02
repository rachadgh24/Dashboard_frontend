'use client';

import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomerStore, type CreateCustomerPayload } from '@/store/customersState';
import { usePermissionsStore } from '@/store/permissionsState';

type Props = {
  onCreated: () => void;
  totalRecords: number;
  mounted: boolean;
};

export default function CreateCustomerSection({ onCreated, totalRecords, mounted }: Props) {
  const { t } = useTranslation();
  const hasClaim = usePermissionsStore((s) => s.hasClaim);
  const canCreate = hasClaim('CreateCustomer');
  const query = useCustomerStore((s) => s.query);
  const filteredCount = useCustomerStore((s) => s.filteredCustomers.length);
  const createCustomer = useCustomerStore((s) => s.createCustomer);

  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [email, setEmail] = useState('');

  const displayCount = query.trim() ? filteredCount : totalRecords;

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
    onCreated();
  };

  return (
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
            ? t('totalCount', { count: displayCount })
            : `${displayCount} total`}
        </span>
      </div>

      {mounted && canCreate && (
        <form onSubmit={handleCreate} className="flex flex-col gap-2">
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
  );
}
