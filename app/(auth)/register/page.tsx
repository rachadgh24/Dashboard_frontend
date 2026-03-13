'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type RegisterPayload = {
  email: string;
  password: string;
  name: string;
  lastName: string;
  city: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';

export default function RegisterPage() {
  const { t, ready } = useTranslation();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState<RegisterPayload>({
    email: '',
    password: '',
    name: '',
    lastName: '',
    city: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  const canSubmit = useMemo(
    () => form.email.trim() !== '' && form.password.trim() !== '' && !isSubmitting,
    [form.email, form.password, isSubmitting],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!form.email.trim() || !form.password.trim()) {
      setErrorMessage(t('emailPasswordRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/Auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
          name: form.name.trim(),
          lastName: form.lastName.trim(),
          city: form.city.trim(),
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        setErrorMessage(responseText || t('registrationFailed'));
        return;
      }

      const data: unknown = await response.json();
      const token =
        typeof data === 'object' && data !== null && 'token' in data
          ? String((data as { token: string }).token)
          : '';

      if (token) {
        localStorage.setItem('token', token);

        const adminData = data as Record<string, unknown>;
        const str = (keys: string[]) => {
          for (const k of keys) {
            const v = adminData[k];
            if (typeof v === 'string' && v.trim()) return v.trim();
          }
          return '';
        };
        const name = str(['name', 'Name', 'fullName', 'FullName', 'firstName', 'FirstName']) || form.name.trim();
        const email = str(['email', 'Email']) || form.email.trim();
        if (name) localStorage.setItem('admin_name', name);
        localStorage.setItem('admin_email', email);
      }

      setSuccessMessage(t('accountCreated'));
      setForm({
        email: '',
        password: '',
        name: '',
        lastName: '',
        city: '',
      });
      const role = token
        ? (() => {
            try {
              const payload = token.split('.')[1];
              if (!payload) return null;
              const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
              const json = decodeURIComponent(
                atob(base64)
                  .split('')
                  .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                  .join('')
              );
              const claims = JSON.parse(json) as Record<string, unknown>;
              const val = claims['role'] ?? claims['Role'];
              const v = String(val ?? '').toLowerCase().replace(/\s/g, '');
              return v === 'admin' ? 'admin' : null;
            } catch {
              return null;
            }
          })()
        : null;
      router.push(role === 'admin' ? '/home' : '/customers');
    } catch {
      setErrorMessage(t('couldNotConnect'));
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
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder={t('email')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
          />

          <input
            type="password"
            value={form.password}
            onChange={(e) => setForm((prev) => ({ ...prev, password: e.target.value }))}
            placeholder={t('password')}
            className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400"
          />

          <input
            value={form.city}
            onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
            placeholder={t('city')}
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