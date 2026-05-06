'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { FileManager } from '@/components/file-management';
import { useDashboard } from '../layout';
import { ProviderIcon } from '@/components/ui/ProviderIcon';
import { Provider } from '@/types/provider.types';

const STORAGE_KEY = 'filesProviderFilter';

/** Pill button for the provider filter bar */
function FilterPill({
  provider,
  selected,
  onClick,
}: {
  provider: Provider | null; // null = "All"
  selected: boolean;
  onClick: () => void;
}) {
  const isAll = provider === null;
  return (
    <button
      onClick={onClick}
      className={`
        inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium
        border transition-all duration-150 flex-shrink-0
        ${selected
          ? 'bg-primary text-white border-primary shadow-sm'
          : 'bg-white text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
        }
      `}
    >
      {isAll ? (
        <>
          <span className="w-3.5 h-3.5 rounded-full bg-current opacity-20 inline-block" />
          All Providers
        </>
      ) : (
        <>
          <ProviderIcon
            type={provider.provider_type}
            size="xs"
            color={selected ? '#ffffff' : undefined}
          />
          {provider.provider_name || provider.name}
        </>
      )}
    </button>
  );
}

export default function FilesPage() {
  const { providers, searchQuery } = useDashboard();

  // '' = all providers; any other string = provider UUID
  const [filterProviderId, setFilterProviderId] = useState<string>('');
  const [hydrated, setHydrated] = useState(false);

  // Restore from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) ?? '';
    setFilterProviderId(saved);
    setHydrated(true);
  }, []);

  const handleFilterChange = useCallback((id: string) => {
    setFilterProviderId(id);
    localStorage.setItem(STORAGE_KEY, id);
  }, []);

  // If saved provider no longer exists in the list, fall back to "All"
  useEffect(() => {
    if (hydrated && filterProviderId && providers.length > 0) {
      const stillExists = providers.some(p => p.id === filterProviderId);
      if (!stillExists) {
        handleFilterChange('');
      }
    }
  }, [hydrated, filterProviderId, providers, handleFilterChange]);

  if (!hydrated) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* ── Provider filter bar ──────────────────────────────────── */}
      {providers.length > 1 && (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-white border-b border-border overflow-x-auto scrollbar-none">
          <span className="text-xs text-muted-foreground flex-shrink-0 mr-1">Filter:</span>

          <FilterPill
            provider={null}
            selected={filterProviderId === ''}
            onClick={() => handleFilterChange('')}
          />

          {providers.map(p => (
            <FilterPill
              key={p.id}
              provider={p}
              selected={filterProviderId === p.id}
              onClick={() => handleFilterChange(p.id)}
            />
          ))}
        </div>
      )}

      {/* ── File Manager ─────────────────────────────────────────── */}
      <FileManager
        providerId={filterProviderId || undefined}
        providers={providers}
        searchQuery={searchQuery}
        className="flex-1 min-h-0"
      />
    </div>
  );
}