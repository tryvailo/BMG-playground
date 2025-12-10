'use client';

import { useLocale } from 'next-intl';
import { Globe } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@kit/ui/dropdown-menu';
import { Button } from '@kit/ui/button';
import { cn } from '@kit/ui/utils';

import { usePathname, useRouter } from '~/lib/navigation';

const languages = [
  { code: 'en', label: 'English' },
  { code: 'ukr', label: 'Українська' },
] as const;

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    // Don't do anything if selecting the same language
    if (newLocale === locale) {
      return;
    }

    // usePathname() from next-intl returns pathname WITHOUT locale prefix
    // e.g., if current URL is /en/home, pathname is "/home"
    // e.g., if current URL is /en/, pathname is "/"
    
    // Get the path without locale - usePathname() already provides this
    let pathWithoutLocale = pathname;
    
    // Fallback: if pathname seems wrong, extract from window.location
    if (typeof window !== 'undefined') {
      const fullPath = window.location.pathname;
      // Check if fullPath contains a locale
      const localeMatch = fullPath.match(/^\/(en|ukr)(\/.*)?$/);
      if (localeMatch && localeMatch[2]) {
        // Extract path after locale (e.g., "/home" from "/en/home")
        pathWithoutLocale = localeMatch[2];
      } else if (localeMatch && !localeMatch[2]) {
        // Just locale, no path (e.g., "/en")
        pathWithoutLocale = '/';
      }
    }
    
    // Ensure path starts with "/"
    if (!pathWithoutLocale.startsWith('/')) {
      pathWithoutLocale = '/' + pathWithoutLocale;
    }
    
    // Construct the new path with the selected locale
    // router.replace from next-intl expects path WITH locale prefix
    const newPath = pathWithoutLocale === '/' 
      ? `/${newLocale}` 
      : `/${newLocale}${pathWithoutLocale}`;
    
    // Use direct navigation to ensure correct URL
    if (typeof window !== 'undefined') {
      window.location.href = newPath;
    } else {
      router.replace(newPath);
    }
  };

  const currentLanguage = languages.find((lang) => lang.code === locale);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="gap-2 hover:bg-accent transition-colors cursor-pointer"
          aria-label="Switch language"
        >
          <Globe className="h-4 w-4" />
          <span className="hidden md:inline-block">Language</span>
          {currentLanguage && (
            <span className="hidden lg:inline-block text-xs text-muted-foreground">
              ({currentLanguage.code.toUpperCase()})
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[150px]">
        {languages.map((language) => {
          const isActive = locale === language.code;
          return (
            <DropdownMenuItem
              key={language.code}
              onClick={() => handleLanguageChange(language.code)}
              className={cn(
                'cursor-pointer transition-colors',
                isActive 
                  ? 'bg-accent font-semibold text-primary' 
                  : 'hover:bg-accent/50'
              )}
            >
              <span className={cn(
                'flex items-center justify-between w-full',
                isActive && 'text-primary'
              )}>
                <span>{language.label}</span>
                {isActive && (
                  <span className="text-xs text-muted-foreground ml-2">
                    ✓
                  </span>
                )}
              </span>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

