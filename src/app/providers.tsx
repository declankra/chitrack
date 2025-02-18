'use client';

import { OpenPanelProvider } from "@/lib/analytics/openpanel/OpenPanelProvider";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <>
      <OpenPanelProvider />
      {children}
    </>
  );
} 