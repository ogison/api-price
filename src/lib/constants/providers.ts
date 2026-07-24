import type { Provider } from '@/types/pricing';

/** Canonical, ordered list of every supported provider. Single source of truth. */
export const PROVIDERS: Provider[] = [
  'openai',
  'google',
  'anthropic',
  'sakura',
];

export const PROVIDER_CONFIG: Record<
  Provider,
  { label: string; className: string; color: string }
> = {
  openai: {
    label: 'OpenAI',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
    color: '#10b981',
  },
  google: {
    label: 'Google',
    className: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
    color: '#3b82f6',
  },
  anthropic: {
    label: 'Anthropic',
    className:
      'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
    color: '#f97316',
  },
  sakura: {
    label: 'Sakura AI',
    className: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
    color: '#ec4899',
  },
};
