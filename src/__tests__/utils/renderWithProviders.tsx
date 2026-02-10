// src/__tests__/utils/renderWithProviders.tsx
/**
 * Test Render Utility
 * ===================
 * Wraps components with necessary providers for testing.
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type RenderOptions, type RenderResult, render } from '@testing-library/react';
import type React from 'react';
import type { ReactElement } from 'react';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '../../contexts/ThemeContext';
import i18n from '../../i18n';

// ============================================
// CREATE TEST QUERY CLIENT
// ============================================

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });
}

// ============================================
// PROVIDER WRAPPER
// ============================================

interface WrapperProps {
  children: React.ReactNode;
}

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
  defaultTheme?: 'dark' | 'light' | 'system';
  locale?: string;
}

// ============================================
// RENDER WITH PROVIDERS
// ============================================

export function renderWithProviders(
  ui: ReactElement,
  {
    queryClient = createTestQueryClient(),
    defaultTheme = 'dark',
    locale = 'pl',
    ...renderOptions
  }: CustomRenderOptions = {},
): RenderResult & { queryClient: QueryClient } {
  // Set i18n language
  i18n.changeLanguage(locale);

  function Wrapper({ children }: WrapperProps) {
    return (
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider defaultTheme={defaultTheme}>{children}</ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    );
  }

  const renderResult = render(ui, { wrapper: Wrapper, ...renderOptions });

  return {
    ...renderResult,
    queryClient,
  } as RenderResult & { queryClient: QueryClient };
}

// ============================================
// RENDER WITH QUERY CLIENT ONLY
// ============================================

export function renderWithQueryClient(
  ui: ReactElement,
  queryClient = createTestQueryClient(),
): RenderResult & { queryClient: QueryClient } {
  function Wrapper({ children }: WrapperProps) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  }

  const renderResult = render(ui, { wrapper: Wrapper });

  return {
    ...renderResult,
    queryClient,
  } as RenderResult & { queryClient: QueryClient };
}

// ============================================
// RENDER WITH THEME ONLY
// ============================================

export function renderWithTheme(
  ui: ReactElement,
  defaultTheme: 'dark' | 'light' | 'system' = 'dark',
): RenderResult {
  function Wrapper({ children }: WrapperProps) {
    return <ThemeProvider defaultTheme={defaultTheme}>{children}</ThemeProvider>;
  }

  return render(ui, { wrapper: Wrapper });
}

// ============================================
// RE-EXPORT TESTING LIBRARY UTILITIES
// ============================================

export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
