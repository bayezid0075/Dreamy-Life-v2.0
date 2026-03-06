'use client';

import { useRouter } from 'next/navigation';
import { Globe2, ArrowLeft } from 'lucide-react';

import { useTheme } from 'next-themes';
import { useLanguage } from '@/components/providers/language-provider';
import { useI18n } from '@/hooks/use-i18n';

import { Button } from '@/components/ui/button';

export default function SettingsPage() {
  const router = useRouter();
  const { theme } = useTheme();
  const { language, setLanguage, toggleLanguage } = useLanguage();
  const { t } = useI18n();

  const isDark = theme === 'dark';

  const isBangla = language === 'bn';

  return (
    <div className="px-3 py-5 sm:px-4 md:px-0 md:py-6 pb-6 md:pb-10">
      {/* Page header */}
      <div className="flex items-center justify-between gap-3 mb-6 md:mb-8">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center h-9 w-9 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm hover:shadow-md hover:border-violet-300 dark:hover:border-violet-500 transition-all active:scale-95"
          >
            <ArrowLeft className="h-4 w-4 text-slate-700 dark:text-slate-200" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              {t('settings.title')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              {t('settings.subtitle')}
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6 max-w-2xl">
        {/* Language card */}
        <section
          className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white/80 dark:bg-slate-900/90 shadow-sm px-4 sm:px-6 py-4 sm:py-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300"
              >
                <Globe2 className="h-4 w-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-semibold tracking-tight text-slate-900 dark:text-slate-50">
                  {t('settings.language.title')}
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md">
                  {t('settings.language.description')}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="inline-flex rounded-full bg-slate-100/80 dark:bg-slate-800/70 p-1">
              <button
                type="button"
                onClick={() => setLanguage('bn')}
                className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                  isBangla
                    ? 'bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50'
                }`}
              >
                {t('settings.language.bn')}
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-4 py-1.5 text-xs sm:text-sm font-semibold rounded-full transition-all ${
                  !isBangla
                    ? 'bg-slate-900 text-slate-50 dark:bg-slate-50 dark:text-slate-900 shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-50'
                }`}
              >
                {t('settings.language.en')}
              </button>
            </div>

            <Button
              type="button"
              variant={isDark ? 'outline' : 'default'}
              onClick={toggleLanguage}
              className="h-9 sm:h-10 px-4 sm:px-5 text-xs sm:text-sm font-semibold"
            >
              {isBangla ? t('settings.language.switchToEn') : t('settings.language.switchToBn')}
            </Button>
          </div>

          <p className="mt-3 text-[11px] sm:text-xs text-slate-500 dark:text-slate-500">
            {t('settings.language.note')}
          </p>
        </section>
      </div>
    </div>
  );
}

