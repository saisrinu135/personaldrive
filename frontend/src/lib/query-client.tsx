'use client';

import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';

// Query key types
export type QueryKey = string | readonly unknown[];

// Query function type
export type QueryFunction<T = unknown> = () => Promise<T>;

// Query options
export interface QueryOptions<T = unknown> {
  enabled?: boolean;
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number;
  onSuccess?: (data: T) => void;
  onError?: (error: Error) => void;
}

// Query result
export interface QueryResult<T = unknown> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  invalidate: () => void;
}

// Cache entry
interface CacheEntry<T = unknown> {
  data: T;
  timestamp: number;
  staleTime: number;
  cacheTime: number;
}

// Query client
class QueryClient {
  private cache = new Map<string, CacheEntry>();
  private subscribers = new Map<string, Set<() => void>>();
  private queries = new Map<string, Promise<any>>();

  private getKeyString(key: QueryKey): string {
    return typeof key === 'string' ? key : JSON.stringify(key);
  }

  private isStale(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.staleTime;
  }

  private isExpired(entry: CacheEntry): boolean {
    return Date.now() - entry.timestamp > entry.cacheTime;
  }

  private notifySubscribers(keyString: string): void {
    const subs = this.subscribers.get(keyString);
    if (subs) {
      subs.forEach(callback => callback());
    }
  }

  subscribe(key: QueryKey, callback: () => void): () => void {
    const keyString = this.getKeyString(key);
    if (!this.subscribers.has(keyString)) {
      this.subscribers.set(keyString, new Set());
    }
    this.subscribers.get(keyString)!.add(callback);

    return () => {
      const subs = this.subscribers.get(keyString);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(keyString);
        }
      }
    };
  }

  async fetchQuery<T>(
    key: QueryKey,
    queryFn: QueryFunction<T>,
    options: QueryOptions<T> = {}
  ): Promise<T> {
    const keyString = this.getKeyString(key);
    const {
      staleTime = 5 * 60 * 1000, // 5 minutes
      cacheTime = 10 * 60 * 1000, // 10 minutes
      retry = 3,
      onSuccess,
      onError,
    } = options;

    // Check if we have a valid cache entry
    const cached = this.cache.get(keyString) as CacheEntry<T> | undefined;
    if (cached && !this.isExpired(cached) && !this.isStale(cached)) {
      return cached.data;
    }

    // Check if query is already in flight
    if (this.queries.has(keyString)) {
      return this.queries.get(keyString);
    }

    // Execute query with retry logic
    const executeQuery = async (attempt = 1): Promise<T> => {
      try {
        const data = await queryFn();
        
        // Cache the result
        this.cache.set(keyString, {
          data,
          timestamp: Date.now(),
          staleTime,
          cacheTime,
        });

        // Notify subscribers
        this.notifySubscribers(keyString);

        // Call success callback
        if (onSuccess) {
          onSuccess(data);
        }

        return data;
      } catch (error) {
        if (attempt < retry) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempt) * 1000));
          return executeQuery(attempt + 1);
        }

        // Call error callback
        if (onError && error instanceof Error) {
          onError(error);
        }

        throw error;
      }
    };

    const queryPromise = executeQuery();
    this.queries.set(keyString, queryPromise);

    try {
      const result = await queryPromise;
      return result;
    } finally {
      this.queries.delete(keyString);
    }
  }

  getQueryData<T>(key: QueryKey): T | undefined {
    const keyString = this.getKeyString(key);
    const cached = this.cache.get(keyString) as CacheEntry<T> | undefined;
    
    if (cached && !this.isExpired(cached)) {
      return cached.data;
    }
    
    return undefined;
  }

  setQueryData<T>(key: QueryKey, data: T): void {
    const keyString = this.getKeyString(key);
    const existing = this.cache.get(keyString);
    
    this.cache.set(keyString, {
      data,
      timestamp: Date.now(),
      staleTime: existing?.staleTime || 5 * 60 * 1000,
      cacheTime: existing?.cacheTime || 10 * 60 * 1000,
    });

    this.notifySubscribers(keyString);
  }

  invalidateQueries(key: QueryKey): void {
    const keyString = this.getKeyString(key);
    this.cache.delete(keyString);
    this.notifySubscribers(keyString);
  }

  invalidateQueriesMatching(predicate: (key: string) => boolean): void {
    for (const [keyString] of this.cache) {
      if (predicate(keyString)) {
        this.cache.delete(keyString);
        this.notifySubscribers(keyString);
      }
    }
  }

  clear(): void {
    this.cache.clear();
    for (const [keyString] of this.subscribers) {
      this.notifySubscribers(keyString);
    }
  }

  // Cleanup expired entries
  private cleanup(): void {
    for (const [keyString, entry] of this.cache) {
      if (this.isExpired(entry)) {
        this.cache.delete(keyString);
      }
    }
  }

  startCleanupTimer(): void {
    setInterval(() => this.cleanup(), 60 * 1000); // Cleanup every minute
  }
}

// Create global query client
const queryClient = new QueryClient();

// Context
const QueryClientContext = createContext<QueryClient | null>(null);

// Provider component
export const QueryClientProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    queryClient.startCleanupTimer();
  }, []);

  return (
    <QueryClientContext.Provider value={queryClient}>
      {children}
    </QueryClientContext.Provider>
  );
};

// Hook to get query client
export const useQueryClient = (): QueryClient => {
  const client = useContext(QueryClientContext);
  if (!client) {
    throw new Error('useQueryClient must be used within QueryClientProvider');
  }
  return client;
};

// Main useQuery hook
export function useQuery<T>(
  key: QueryKey,
  queryFn: QueryFunction<T>,
  options: QueryOptions<T> = {}
): QueryResult<T> {
  const client = useQueryClient();
  const [state, setState] = useState<{
    data: T | undefined;
    isLoading: boolean;
    isError: boolean;
    error: Error | null;
  }>(() => ({
    data: client.getQueryData<T>(key),
    isLoading: true,
    isError: false,
    error: null,
  }));

  const { enabled = true } = options;

  const memoizedOptions = useMemo(() => options, [JSON.stringify(options)]);

  const refetch = useCallback(async () => {
    if (!enabled) return;

    setState(prev => ({ ...prev, isLoading: true, isError: false, error: null }));

    try {
      const data = await client.fetchQuery(key, queryFn, memoizedOptions);
      setState({ data, isLoading: false, isError: false, error: null });
    } catch (error) {
      setState({
        data: undefined,
        isLoading: false,
        isError: true,
        error: error instanceof Error ? error : new Error(String(error) || 'Unknown error'),
      });
    }
  }, [client, key, queryFn, memoizedOptions, enabled]);

  const invalidate = useCallback(() => {
    client.invalidateQueries(key);
  }, [client, key]);

  // Subscribe to cache changes
  useEffect(() => {
    const unsubscribe = client.subscribe(key, () => {
      const newData = client.getQueryData<T>(key);
      setState(prev => ({ ...prev, data: newData }));
    });

    return unsubscribe;
  }, [client, key]);

  // Initial fetch
  useEffect(() => {
    if (enabled) {
      refetch();
    }
  }, [enabled]);

  return {
    ...state,
    refetch,
    invalidate,
  };
}