'use client';

interface FilterBarProps {
  filters: {
    key: string;
    label: string;
    options: { value: string; label: string }[];
  }[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  onSearch?: (query: string) => void;
  searchPlaceholder?: string;
}

export function FilterBar({ filters, values, onChange, onSearch, searchPlaceholder }: FilterBarProps) {
  return (
    <div className="flex flex-wrap gap-3 mb-6">
      {onSearch && (
        <input
          type="text"
          placeholder={searchPlaceholder || 'Buscar...'}
          onChange={(e) => onSearch(e.target.value)}
          className="px-4 py-2 bg-th-surface border border-th rounded-xl text-sm text-th placeholder:text-th-muted focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition"
        />
      )}
      {filters.map((filter) => (
        <select
          key={filter.key}
          value={values[filter.key] || ''}
          onChange={(e) => onChange(filter.key, e.target.value)}
          className="px-3 py-2 bg-th-surface border border-th rounded-xl text-sm text-th focus:outline-none focus:ring-2 focus:ring-primary-500/30 focus:border-primary-500/50 transition"
        >
          <option value="">{filter.label}</option>
          {filter.options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      ))}
    </div>
  );
}
