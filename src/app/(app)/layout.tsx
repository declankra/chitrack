// src/app/(app)/layout.tsx
'use client';

import NavigationDock from '@/components/ui/NavigationDock';
import { usePathname } from 'next/navigation';

export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const pathname = usePathname();
  const shouldShowDock = !['/'].includes(pathname); // Don't show dock on landing page

  return (
    <div className="mx-auto max-w-md min-h-screen bg-background">
      {/* Mobile app container with max width for larger screens */}
      <div className="relative min-h-screen max-w-md mx-auto pb-[72px]">
        {/* Content area */}
        <main className="px-4 py-6">
          {children}
        </main>

        {/* Navigation Dock */}
        {shouldShowDock && <NavigationDock />}
      </div>
    </div>
  );
}