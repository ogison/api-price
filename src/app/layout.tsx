import type { Metadata } from 'next';
import Link from 'next/link';
import { Coins } from 'lucide-react';
import { ThemeProvider } from '@/components/layout/theme-provider';
import { ThemeToggle } from '@/components/layout/theme-toggle';
import { CurrencyProvider } from '@/context/currency-context';
import '@/styles/globals.css';

export const metadata: Metadata = {
  title: 'API Price Comparison',
  description:
    'Compare LLM API pricing across OpenAI, Google (Vertex AI), and Anthropic',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider>
          <CurrencyProvider>
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
              <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
                <Link
                  href="/"
                  className="flex items-center gap-2 transition-colors hover:text-primary"
                >
                  <Coins className="h-5 w-5 text-primary" />
                  <span className="text-lg font-semibold tracking-tight">
                    API Price Comparison
                  </span>
                </Link>
                <div className="flex items-center gap-4">
                  <Link
                    href="/data-sources"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    Data Sources
                  </Link>
                  <ThemeToggle />
                </div>
              </div>
            </header>
            {children}
            <footer className="mt-auto border-t py-6 text-center text-sm text-muted-foreground">
              <p>
                <Link
                  href="/data-sources"
                  className="underline-offset-4 hover:underline"
                >
                  Data Sources
                </Link>
                : OpenAI, Google Cloud, Anthropic official pricing pages
              </p>
            </footer>
          </CurrencyProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
