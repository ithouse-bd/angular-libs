import { Injectable, PLATFORM_ID, inject, signal, effect } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ThemeMode = 'light' | 'dark' | 'auto';

@Injectable({ providedIn: 'root' })
export class ThemeInitializer {
  private readonly platformId = inject(PLATFORM_ID);

  readonly currentTheme = signal<ThemeMode>('auto');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const saved = typeof localStorage !== 'undefined' ? localStorage.getItem('theme') : null;

    if (saved === 'light' || saved === 'dark' || saved === 'auto') {
      this.currentTheme.set(saved as ThemeMode);
    } else {
      // auto mode: follow system preference initially; listener below keeps it in sync
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const mode: ThemeMode = prefersDark ? 'dark' : 'light';
      this.currentTheme.set(mode);
    }

    // Keep the document attribute in sync whenever the active mode changes.
    effect(() => {
      const mode = this.currentTheme();
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', mode);
      }
    });

    // When mode is `auto`, keep it in sync with the OS color-scheme preference.
    if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
      const media = window.matchMedia('(prefers-color-scheme: dark)');

      const handler = () => {
        if (this.currentTheme() === 'auto') {
          const nextMode: ThemeMode = media.matches ? 'dark' : 'light';
          this.currentTheme.set(nextMode);
        }
      };

      if (typeof media.addEventListener === 'function') {
        media.addEventListener('change', handler);
      } else if (typeof media.addListener === 'function') {
        media.addListener(handler);
      }
    }
  }


  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('theme', mode);
    }
  }
}
