'use client';

import { useState } from 'react';

export function useFilters(initialFilters: Record<string, string> = {}) {
  const [filters, setFilters] = useState(initialFilters);
  const [search, setSearch] = useState('');

  const updateFilter = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const resetFilters = () => {
    setFilters(initialFilters);
    setSearch('');
  };

  return { filters, search, setSearch, updateFilter, resetFilters };
}
