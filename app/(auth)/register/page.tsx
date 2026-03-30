'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { API_BASE } from '@/lib/apiBase';
import { apiFetch } from '@/lib/apiClient';
import { usePermissionsStore } from '@/store/permissionsState';
import { getLandingRoute } from '@/lib/landingRoute';

type RegisterPayload = {
  organizationName: string;
  phoneNumber: string;
  password: string;
  name: string;
  lastName: string;
};

export default function RegisterPage() {
  const { t, ready } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<RegisterPayload>({
    organizationName: '',
    phoneNumber: '',
    password: '',
    name: '',
    lastName: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const canSubmit = useMemo(
    () =>
      form.organizationName.trim() !== '' &&
      form.phoneNumber.trim() !== '' &&
      form.password.trim() !== '' &&
      !isSubmitting,
    [form.organizationName, form.phoneNumber, form.password, isSubmitting],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!form.organizationName.trim() || !form.phoneNumber.trim() || !form.password.trim()) {
      setErrorMessage(t('phonePasswordRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const data = await apiFetch<{ token: string }>(`${API_BASE}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: form.organizationName.trim(),
          phoneNumber: form.phoneNumber.trim(),
          password: form.password,
          name: form.name.trim(),
          lastName: form.lastName.trim(),
        }),
      });

      const token = data?.token ?? '';
      if (token) {
        localStorage.setItem('token', token);
        if (form.name.trim()) localStorage.setItem('admin_name', form.name.trim());
        localStorage.setItem('admin_phone', form.phoneNumber.trim());
        await usePermissionsStore.getState().fetchPermissions();
      }

      setSuccessMessage(t('accountCreated'));
      setForm({
        organizationName: '',
        phoneNumber: '',
        password: '',
        name: '',
        lastName: '',
      });
      const landing = getLandingRoute(usePermissionsStore.getState().hasClaim);
      router.push(landing);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : t('couldNotConnect'));
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!mounted || !ready) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-10">
        <div className="absolute end-4 top-4">
          <LanguageSwitcher />
        </div>
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl animate-pulse">
          <div className="mb-6 h-8 w-3/4 rounded bg-slate-200" />
          <div className="mb-4 h-10 rounded-xl bg-slate-100" />
          <div className="mb-4 h-10 rounded-xl bg-slate-100" />
          <div className="mb-4 h-10 rounded-xl bg-slate-100" />
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-10">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 space-y-2">
          <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {t('createYourAccount')}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">{t('register')}</h1>
          <p className="text-sm text-slate-500">
            {t('joinNow')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={form.organizationName}
              onChange={(e) => setForm((prev) => ({ ...prev, organizationName: e.target.value }))}
              placeholder={t('organizationName')}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 sm:col-span-2"
            />
            <input
              value={form.name}
              onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              placeholder={t('firstName')}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
            />
            <input
              value={form.lastName}
              onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
              placeholder={t('lastName')}
              className="rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
            />
          </div>

          <input
            type="tel"
            value={form.phoneNumber}
            onChange={(e) => setForm((prev) => ({ ...prev, phoneNumber: e.target.value }))}
            placeholder={t('phoneNumber')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
          />

          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={t('password')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
          />

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </p>
          )}

          {successMessage && (
            <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              {successMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t('creatingAccount') : t('createAccount')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {t('alreadyHaveAccount')}{' '}
          <Link href="/logIn" className="font-medium text-blue-600 hover:text-blue-700">
            {t('signIn')}
          </Link>
        </p>
      </div>
    </main>
  );
}