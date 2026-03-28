import type { Provider } from '@/types/pricing';

export const PROVIDER_CONFIG: Record<
  Provider,
  { label: string; className: string }
> = {
  openai: {
    label: 'OpenAI',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  },
  google: {
    label: 'Google',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  },
  anthropic: {
    label: 'Anthropic',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  },
};
