// src/app/(app)/layout.tsx
'use client';

import NavigationDock from '@/components/utilities/NavigationDock';
import { usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const shouldShowDock = !['/'].includes(pathname);

  return (
    // Full-width background container
    <div className="min-h-screen w-full bg-background flex items-center justify-center">
      {/* iPhone mockup container with fixed dimensions */}
      <div className="relative w-full max-w-[390px] h-[844px] mx-auto bg-background overflow-hidden shadow-2xl rounded-[40px] border border-border">
        {/* Safe area top spacing - mimics iPhone notch area */}
        <div className="h-12 bg-background" />
        
        {/* Main scrollable content area with padding for dock */}
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
      </div>
    </div>
  );
}