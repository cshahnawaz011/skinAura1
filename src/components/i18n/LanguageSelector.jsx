import React, { useState, useEffect } from 'react';
import { LANGUAGES } from './translations';
import { Globe, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function LanguageSelector({ compact = false }) {
  const [current, setCurrent] = useState(localStorage.getItem('glowai-lang') || 'en');
  const [open, setOpen] = useState(false);

  const currentLang = LANGUAGES.find(l => l.code === current) || LANGUAGES[0];

  const select = (code) => {
    const lang = LANGUAGES.find(l => l.code === code);
    localStorage.setItem('glowai-lang', code);
    setCurrent(code);
    setOpen(false);
    document.documentElement.dir = lang?.dir || 'ltr';
    window.location.reload();
  };

  useEffect(() => {
    const lang = LANGUAGES.find(l => l.code === current);
    document.documentElement.dir = lang?.dir || 'ltr';
  }, [current]);

  return (
    <>
      <Button
        variant="ghost"
        size={compact ? 'icon' : 'sm'}
        onClick={() => setOpen(true)}
        className={compact ? '' : 'gap-2 justify-start w-full'}
      >
        <Globe className="w-4 h-4" />
        {!compact && <span>{currentLang.flag} {currentLang.name}</span>}
        {compact && <span className="text-xs">{currentLang.flag}</span>}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-xs p-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="flex items-center gap-2 text-base">
              <Globe className="w-4 h-4 text-pink-500" />
              Choose Language
            </DialogTitle>
          </DialogHeader>
          <div className="overflow-y-auto max-h-72 pb-3">
            {LANGUAGES.map(lang => (
              <button
                key={lang.code}
                onClick={() => select(lang.code)}
                className={`w-full flex items-center gap-3 px-5 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  current === lang.code ? 'bg-pink-50 dark:bg-pink-900/20 text-pink-600 dark:text-pink-300 font-semibold' : 'text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{lang.flag}</span>
                <span className="flex-1 text-left">{lang.name}</span>
                {current === lang.code && <Check className="w-4 h-4 text-pink-500" />}
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}