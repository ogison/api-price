'use client';

import { Search } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { PROVIDER_CONFIG } from '@/lib/constants/providers';
import type { Provider } from '@/types/pricing';

interface PricingFiltersProps {
  activeProviders: Provider[];
  onProvidersChange: (providers: Provider[]) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const providers: Provider[] = ['openai', 'google', 'anthropic'];

export function PricingFilters({
  activeProviders,
  onProvidersChange,
  searchQuery,
  onSearchChange,
}: PricingFiltersProps) {
  const handleProviderToggle = (provider: Provider, checked: boolean) => {
    if (checked) {
      onProvidersChange([...activeProviders, provider]);
    } else {
      const next = activeProviders.filter((p) => p !== provider);
      if (next.length > 0) onProvidersChange(next);
    }
  };

  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {providers.map((provider) => (
          <label
            key={provider}
            className="flex cursor-pointer items-center gap-1.5 text-sm font-medium"
          >
            <Checkbox
              checked={activeProviders.includes(provider)}
              onCheckedChange={(checked) =>
                handleProviderToggle(provider, checked === true)
              }
            />
            {PROVIDER_CONFIG[provider].label}
          </label>
        ))}
      </div>
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search models..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-8"
        />
      </div>
    </div>
  );
}
