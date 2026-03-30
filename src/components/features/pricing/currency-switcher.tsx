'use client';

import {
  CURRENCIES,
  TOKEN_UNITS,
  useCurrency,
} from '@/context/currency-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CurrencySwitcher() {
  const { currency, setCurrency, tokenUnit, setTokenUnit } = useCurrency();

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">
          Currency:
        </span>
        <Select
          value={currency}
          onValueChange={(v) => setCurrency(v as typeof currency)}
        >
          <SelectTrigger className="h-8 w-[80px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CURRENCIES.map((c) => (
              <SelectItem key={c} value={c}>
                {c}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-muted-foreground">Unit:</span>
        <Select
          value={tokenUnit}
          onValueChange={(v) => setTokenUnit(v as typeof tokenUnit)}
        >
          <SelectTrigger className="h-8 w-[100px] text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TOKEN_UNITS.map((u) => (
              <SelectItem key={u} value={u}>
                /{u}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
