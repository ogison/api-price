'use client';

import { CURRENCIES, useCurrency } from '@/context/currency-context';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function CurrencySwitcher() {
  const { currency, setCurrency, exchangeRate, ratesUpdatedAt } = useCurrency();

  return (
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
      {currency !== 'USD' && (
        <span className="text-xs text-muted-foreground">
          1 USD = {exchangeRate} {currency} · {ratesUpdatedAt} 時点
        </span>
      )}
    </div>
  );
}
