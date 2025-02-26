// src/app/(app)/layout.tsx
'use client';

import NavigationDock from '@/components/utilities/NavigationDock';
import { usePathname } from 'next/navigation';
import { StationsProvider } from '@/lib/providers/StationsProvider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const shouldShowDock = !['/'].includes(pathname);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 3,
          },
        },
      })
  );

  // Set specific query defaults after client initialization
  useEffect(() => {
    // For station metadata, use a 7-day stale time to match server-side caching
    queryClient.setQueryDefaults(['stations'], {
      staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    });
  }, [queryClient]);

  return (
    // Full-width background container
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      {/* iPhone mockup container with fixed dimensions */}
      <div className="relative w-full max-w-[390px] h-[844px] mx-auto bg-background overflow-hidden shadow-2xl rounded-[40px] border border-border">
        {/* Safe area top spacing - mimics iPhone notch area */}
        <div className="h-12 bg-background" />
        
        {/* Main scrollable content area with padding for dock */}
        <QueryClientProvider client={queryClient}>
          <StationsProvider>
            <div className={`h-[calc(844px-3rem)] overflow-hidden flex flex-col ${shouldShowDock ? 'pb-24' : ''}`}>
              <main className="flex-1 overflow-y-auto px-4">
                {children}
              </main>

              {/* Navigation Dock */}
              {shouldShowDock && (
                <div className="w-full">
                  <NavigationDock />
                </div>
              )}
            </div>
          </StationsProvider>
        </QueryClientProvider>
      </div>
    </div>
  );
}