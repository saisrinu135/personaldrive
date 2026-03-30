'use client';

import { useEffect } from 'react';

export function ServiceWorkerRegistration() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          console.log('[PWA] Service worker registered:', registration.scope);
        })
        .catch((error) => {
          console.error('[PWA] Service worker registration failed:', error);
        });
    }
  }, []);

  return null;
}
