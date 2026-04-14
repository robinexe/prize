'use client';

import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

interface UseFetchOptions {
  immediate?: boolean;
}

export function useFetch<T>(url: string, options: UseFetchOptions = { immediate: true }) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async (params?: Record<string, unknown>) => {
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'https://api.marinaprizeclub.com/api/v1';
      const res = await axios.get(`${baseURL}${url}`, {
        params,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      setData(res.data);
      return res.data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [url]);

  useEffect(() => {
    if (options.immediate) fetchData();
  }, [fetchData, options.immediate]);

  return { data, loading, error, refetch: fetchData };
}
