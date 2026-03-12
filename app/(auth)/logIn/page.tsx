'use client';

import { FormEvent, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '@/components/LanguageSwitcher';

type LoginPayload = {
  email: string;
  password: string;
};

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://localhost:7190';

export default function LoginPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const [form, setForm] = useState<LoginPayload>({
    email: '',
    password: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const canSubmit = useMemo(
    () => form.email.trim() !== '' && form.password.trim() !== '' && !isSubmitting,
    [form.email, form.password, isSubmitting],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    if (!form.email.trim() || !form.password.trim()) {
      setErrorMessage(t('emailPasswordRequired'));
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE}/api/Auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email.trim(),
          password: form.password,
        }),
      });

      if (!response.ok) {
        const responseText = await response.text();
        setErrorMessage(responseText || t('loginFailed'));
        return;
      }

      const data: unknown = await response.json();
      const token =
        typeof data === 'object' && data !== null && 'token' in data
          ? String((data as { token: string }).token)
          : '';

      if (!token) {
        setErrorMessage(t('noTokenReturned'));
        return;
      }

      localStorage.setItem('token', token);

      const adminData = data as Record<string, unknown>;
      const str = (keys: string[]) => {
        for (const k of keys) {
          const v = adminData[k];
          if (typeof v === 'string' && v.trim()) return v.trim();
        }
        return '';
      };
      const name = str(['name', 'Name', 'fullName', 'FullName', 'firstName', 'FirstName']);
      const email = str(['email', 'Email']) || form.email.trim();
      if (name) localStorage.setItem('admin_name', name);
      localStorage.setItem('admin_email', email);

      router.push('/posts');
    } catch {
      setErrorMessage(t('couldNotConnect'));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-100 via-white to-blue-100 px-4 py-10">
      <div className="absolute end-4 top-4">
        <LanguageSwitcher />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
        <div className="mb-6 space-y-2">
          <p className="inline-flex rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
            {t('welcomeBack')}
          </p>
          <h1 className="text-2xl font-semibold text-slate-900">{t('login')}</h1>
          <p className="text-sm text-slate-500">
            {t('signInSubtitle')}
          </p>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
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

          {errorMessage && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
              {errorMessage}
            </p>
          )}

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? t('signingIn') : t('signIn')}
          </button>
        </form>

        <p className="mt-4 text-center text-xs text-slate-500">
          {t('dontHaveAccount')}{' '}
          <Link href="/register" className="font-medium text-blue-600 hover:text-blue-700">
            {t('createOne')}
          </Link>
        </p>
      </div>
    </main>
  );
}