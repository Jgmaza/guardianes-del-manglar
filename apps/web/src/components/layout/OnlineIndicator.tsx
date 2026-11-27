'use client';

import { useEffect, useState } from 'react';
import { listUnsyncedReports } from '@/lib/offline/db';
import { syncPendingReports } from '@/lib/offline/sync';

export function OnlineIndicator() {
  const [online, setOnline] = useState(true);
  const [pending, setPending] = useState(0);

  useEffect(() => {
    const refresh = async () => {
      setOnline(navigator.onLine);
      const unsynced = await listUnsyncedReports();
      setPending(unsynced.length);
      if (navigator.onLine && unsynced.length > 0) {
        await syncPendingReports();
        const after = await listUnsyncedReports();
        setPending(after.length);
      }
    };

    void refresh();
    window.addEventListener('online', refresh);
    window.addEventListener('offline', refresh);
    return () => {
      window.removeEventListener('online', refresh);
      window.removeEventListener('offline', refresh);
    };
  }, []);

  return (
    <div
      className="flex items-center gap-2 rounded-full bg-mg-950/60 px-3 py-1.5 text-xs"
      role="status"
      aria-live="polite"
    >
      <span
        className={`inline-block h-2 w-2 rounded-full ${online ? 'bg-emerald-400' : 'bg-amber-400'}`}
      />
      <span className="text-emerald-100">
        {online ? 'En línea' : 'Sin conexión'}
        {pending > 0 ? ` · ${pending} pendiente${pending === 1 ? '' : 's'} de sincronizar` : ''}
      </span>
    </div>
  );
}
