import React, { useState, useEffect } from 'react';
import { LANGUAGES } from './translations';
import { Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function LanguageSelector({ compact = false }) {
  const [current, setCurrent] = useState(localStorage.getItem('glowai-lang') || 'en');
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0];

  const select = (code) => {
    const lang = LANGUAGES.find(l => l.code === code);
    localStorage.setItem('glowai-lang', code);
    setCurrent(code);
    setOpen(false);
    // Update dir for RTL languages
    document.documentElement.dir = lang?.dir || 'ltr';
    window.location.reload();
  };

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === current);
    document.documentElement.dir = lang?.dir || 'ltr';
  }, [current]);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        onClick={() => setOpen(!open)}
        className={compact ? '' : 'gap-2 justify-start w-full'}
      >
        <Globe className="w-4 h-4" />
        {!compact && <span>{currentLang.flag} {currentLang.name}</span>}
        {compact && <span className="text-xs">{currentLang.flag}</span>}
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute bottom-full left-0 mb-2 w-48 bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 overflow-hidden max-h-72 overflow-y-auto">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => select(lang.code)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  current === lang.code ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span>{lang.name}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}