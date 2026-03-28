'use client';

import {
  CURRENCIES,
  TOKEN_UNITS,
  useCurrency,
} from '@/context/currency-context';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';

export function CurrencySwitcher() {
  const { currency, setCurrency, tokenUnit, setTokenUnit } = useCurrency();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Currency:
        </span>
        <ToggleGroup
          type="single"
          value={currency}
          onValueChange={(v) => {
            if (v) setCurrency(v as typeof currency);
          }}
        >
          {CURRENCIES.map((c) => (
            <ToggleGroupItem key={c} value={c} className="text-xs">
              {c}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Unit:</span>
        <ToggleGroup
          type="single"
          value={tokenUnit}
          onValueChange={(v) => {
            if (v) setTokenUnit(v as typeof tokenUnit);
          }}
        >
          {TOKEN_UNITS.map((u) => (
            <ToggleGroupItem key={u} value={u} className="text-xs">
              /{u}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}
