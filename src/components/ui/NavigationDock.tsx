// src/components/ui/NavigationDock.tsx
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Map } from 'lucide-react';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

const DOCK_ITEMS = [
  { name: 'Home', icon: Home, path: '/home' },
  { name: 'Search', icon: Search, path: '/search' },
  { name: 'Map', icon: Map, path: '/map' },
];

export default function NavigationDock() {
  const pathname = usePathname();
  
  return (
    <div className="absolute bottom-0 left-0 right-0 flex justify-center items-center w-full bg-gradient-to-t from-background/80 to-background/0 backdrop-blur-lg">
      <nav className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-2 px-4 rounded-full shadow-lg mb-6">
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          
          return (
            <Link
              key={item.name}
              href={item.path}
              className={cn(
                "relative cursor-pointer p-3 rounded-full transition-colors",
                "text-muted-foreground hover:text-primary",
                isActive && "text-primary"
              )}
            >
              <Icon size={24} className="relative z-10" />
              
              {isActive && (
                <motion.div
                  layoutId="tubelight"
                  className="absolute inset-0 w-full h-full -z-0"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                >
                  {/* Tubelight effect */}
                  <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full">
                    {/* Glow effects */}
                    <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -bottom-2 -left-1" />
                    <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -bottom-1 left-0" />
                    <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm -bottom-0.5 left-1.5" />
                  </div>
                </motion.div>
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}