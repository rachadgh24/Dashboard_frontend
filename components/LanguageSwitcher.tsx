'use client';

import { useLocale } from '@/components/I18nProvider';

export default function LanguageSwitcher() {
  const { locale, setLocale } = useLocale();

  return (
    <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white p-1 text-xs font-medium">
      <button
        type="button"
        onClick={() => setLocale('en')}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          locale === 'en' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="English"
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLocale('ar')}
        className={`rounded-md px-2.5 py-1.5 transition-colors ${
          locale === 'ar' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
        }`}
        aria-label="العربية"
      >
        AR
      </button>
    </div>
  );
}
