'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useCustomerStore } from '../../../../store/customersState';

export default function CustomerPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const customer = useCustomerStore((state) => state.SelectedCustomer);
  const fetchCustomer = useCustomerStore((state) => state.fetchCustomer);
  const updateCustomer = useCustomerStore((state) => state.updateCustomer);
  const deleteCustomer = useCustomerStore((state) => state.deleteCustomer);

  const params = useParams();
  const id = params.id as string;

  useEffect(() => {
    const ensureCustomer = async () => {
      if (!customer) {
        await fetchCustomer(id);
      }
    };
    ensureCustomer();
  }, [fetchCustomer, id, customer]);

  if (!id) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-700 text-lg">{t('noIdProvided')}</div>
      </main>
    );
  }

  if (!customer) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-700 text-lg">{t('loading')}</div>
      </main>
    );
  }

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget as HTMLFormElement);
    const name = String(formData.get('name') ?? '').trim();
    const lastName = String(formData.get('lastName') ?? '').trim();
    const city = String(formData.get('city') ?? '').trim();

    await updateCustomer(customer.id, { name, lastName, city });
    router.push('/customers');
  };

  const handleDelete = async () => {
    await deleteCustomer(customer.id);
    router.push('/customers');
  };

  return (
    <main className="flex min-h-full items-center justify-center bg-transparent py-8">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8">
        <h1 className="text-2xl font-semibold text-gray-900 mb-6">
          {t('editCustomerId', { id: customer.id })}
        </h1>

        <form onSubmit={handleSave} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('name')}
            </label>
            <input
              name="name"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              defaultValue={customer.name ?? ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('lastName')}
            </label>
            <input
              name="lastName"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              defaultValue={customer.lastName ?? ''}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              {t('city')}
            </label>
            <input
              name="city"
              className="mt-1 w-full rounded-lg border border-slate-200 p-2.5 text-black"
              defaultValue={customer.city ?? ''}
            />
          </div>

          <div className="mt-4 flex items-center justify-between">
            <button
              type="submit"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-800"
            >
              {t('saveChanges')}
            </button>
            <button
              type="button"
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
              onClick={handleDelete}
            >
              {t('deleteCustomer')}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
