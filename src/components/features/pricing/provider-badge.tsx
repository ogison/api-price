import { Badge } from '@/components/ui/badge';
import { PROVIDER_CONFIG } from '@/lib/constants/providers';
import type { Provider } from '@/types/pricing';

export function ProviderBadge({ provider }: { provider: Provider }) {
  const config = PROVIDER_CONFIG[provider];

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
}
