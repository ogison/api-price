'use client';

import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
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
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <ToggleGroup
        type="multiple"
        value={activeProviders}
        onValueChange={(value) => {
          if (value.length > 0) {
            onProvidersChange(value as Provider[]);
          }
        }}
        className="justify-start"
      >
        {providers.map((provider) => (
          <ToggleGroupItem
            key={provider}
            value={provider}
            aria-label={`Toggle ${PROVIDER_CONFIG[provider].label}`}
          >
            {PROVIDER_CONFIG[provider].label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      <Input
        placeholder="Search models..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        className="max-w-xs"
      />
    </div>
  );
}
