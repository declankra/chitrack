// src/components/ui/NavigationDock.tsx

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Map } from 'lucide-react';
import { Dock, DockIcon } from '@/components/ui/dock';

interface NavigationDockProps {
  className?: string;
}

export default function NavigationDock({ className }: NavigationDockProps) {
  const pathname = usePathname();

  return (
    <div className="fixed bottom-0 left-0 right-0 flex justify-center items-center w-full pb-[env(safe-area-inset-bottom)] bg-gradient-to-t from-background/80 to-background/0 backdrop-blur-lg">
      <Dock 
        className="mb-4 border-none shadow-lg bg-background/80"
        iconSize={24}
        iconMagnification={32}
        iconDistance={80}
        direction="middle"
      >
        <Link href="/home">
          <DockIcon 
            className={`transition-all ${
              pathname === '/home' 
                ? 'after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary' 
                : ''
            }`}
          >
            <Home 
              className={pathname === '/home' ? 'text-primary' : 'text-muted-foreground'}
              size={24} 
            />
          </DockIcon>
        </Link>

        <Link href="/search">
          <DockIcon 
            className={`transition-all ${
              pathname === '/search' 
                ? 'after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary' 
                : ''
            }`}
          >
            <Search 
              className={pathname === '/search' ? 'text-primary' : 'text-muted-foreground'}
              size={24} 
            />
          </DockIcon>
        </Link>

        <Link href="/map">
          <DockIcon 
            className={`transition-all ${
              pathname === '/map' 
                ? 'after:content-[""] after:absolute after:-bottom-1 after:left-1/2 after:-translate-x-1/2 after:w-1 after:h-1 after:rounded-full after:bg-primary' 
                : ''
            }`}
          >
            <Map 
              className={pathname === '/map' ? 'text-primary' : 'text-muted-foreground'}
              size={24} 
            />
          </DockIcon>
        </Link>
      </Dock>
    </div>
  );
}