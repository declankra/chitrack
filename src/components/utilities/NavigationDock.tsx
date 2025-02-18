// src/components/ui/NavigationDock.tsx
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Search, Map } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useState, useEffect } from 'react';
import { useStations } from '@/lib/hooks/useStations';
import { Card } from '@/components/ui/card';
import { Station } from '@/lib/types/cta';
import { StationStop } from '@/lib/types/cta';

const DOCK_ITEMS = [
  { name: 'Home', icon: Home, path: '/home' },
  { name: 'Map', icon: Map, path: '/map' },
  { name: 'Search', icon: Search, path: '/search' },
];

export default function NavigationDock() {
  const pathname = usePathname();
  const router = useRouter();
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { data: stations = [] } = useStations();
  const [searchResults, setSearchResults] = useState<typeof stations>([]);
  
  // Debug log for stations data
  useEffect(() => {
    console.log('Stations data loaded:', { count: stations.length, firstFew: stations.slice(0, 3) });
  }, [stations]);

  // Auto-expand search when on search page
  useEffect(() => {
    console.log('Search expanded state:', isSearchExpanded, 'pathname:', pathname);
    setIsSearchExpanded(pathname === '/search');
  }, [pathname]);

  useEffect(() => {
    console.log('Search query changed:', searchQuery);
    if (searchQuery.trim()) {
      const results = stations.filter((station: Station) => 
        station.stationName.toLowerCase().includes(searchQuery.toLowerCase().trim())
      );
      console.log('Filtered results:', { 
        query: searchQuery, 
        resultCount: results.length, 
        results: results.slice(0, 3)
      });
      setSearchResults(results);
      // Emit search query changed event
      const event = new CustomEvent('searchQueryChanged', { detail: searchQuery });
      window.dispatchEvent(event);
    } else {
      setSearchResults([]);
      // Also emit empty query
      const event = new CustomEvent('searchQueryChanged', { detail: '' });
      window.dispatchEvent(event);
    }
  }, [searchQuery, stations]);

  // Debug log for search results updates
  useEffect(() => {
    console.log('Search results updated:', { 
      count: searchResults.length, 
      results: searchResults.slice(0, 3),
      isExpanded: isSearchExpanded
    });
  }, [searchResults, isSearchExpanded]);
  
  const handleSearchClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (!isSearchExpanded) {
      setIsSearchExpanded(true);
      router.push('/search');
    }
  };

  const handleStationSelect = (station: typeof stations[0]) => {
    setSearchQuery('');
    setSearchResults([]);
    // Don't collapse search on the search page
    if (pathname !== '/search') {
      setIsSearchExpanded(false);
    }
    // Navigate to search page with station if not already there
    if (pathname !== '/search') {
      router.push('/search');
    }
    // Emit a custom event that the search page can listen to
    const event = new CustomEvent('stationSelected', { detail: station });
    window.dispatchEvent(event);
  };
  
  return (
    <div className="absolute bottom-0 left-0 right-0 flex flex-col justify-center items-center w-full bg-gradient-to-t from-background/80 to-background/0 backdrop-blur-lg">
      {/* Search Results */}
      <AnimatePresence>
        {isSearchExpanded && searchResults.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-[90%] max-h-[40vh] overflow-y-auto mb-2"
          >
            <Card className="w-full overflow-hidden">
              <ul className="divide-y">
                {searchResults.map((station: Station) => (
                  <li
                    key={station.stationId}
                    onClick={() => handleStationSelect(station)}
                    className="cursor-pointer p-3 hover:bg-accent transition-colors"
                  >
                    <div className="font-medium">{station.stationName}</div>
                    <div className="text-xs text-muted-foreground">
                      {station.stops.map((stop: StationStop) => stop.directionName).filter(Boolean).join(' • ')}
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Dock */}
      <motion.nav 
        className="flex items-center gap-3 bg-background/5 border border-border backdrop-blur-lg py-2 px-4 rounded-full shadow-lg mb-6"
        animate={{
          width: isSearchExpanded ? "90%" : "auto"
        }}
      >
        {DOCK_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          const isSearch = item.name === 'Search';
          
          return (
            <motion.div
              key={item.name}
              className="flex items-center"
              animate={{
                flex: isSearch && isSearchExpanded ? 1 : "none"
              }}
            >
              {isSearch ? (
                <div className="flex items-center w-full">
                  <button
                    onClick={handleSearchClick}
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
                        <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full">
                          <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -bottom-2 -left-1" />
                          <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -bottom-1 left-0" />
                          <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm -bottom-0.5 left-1.5" />
                        </div>
                      </motion.div>
                    )}
                  </button>
                  {isSearchExpanded && (
                    <motion.input
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: "100%", opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Start typing..."
                      className="flex-1 bg-transparent border-none outline-none text-sm px-3 text-foreground placeholder:text-muted-foreground"
                      autoFocus
                    />
                  )}
                </div>
              ) : (
                <Link
                  href={item.path}
                  className={cn(
                    "relative cursor-pointer p-3 rounded-full transition-colors",
                    "text-muted-foreground hover:text-primary",
                    isActive && "text-primary"
                  )}
                  onClick={() => {
                    setIsSearchExpanded(false);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
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
                      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-primary rounded-b-full">
                        <div className="absolute w-8 h-4 bg-primary/20 rounded-full blur-md -bottom-2 -left-1" />
                        <div className="absolute w-6 h-4 bg-primary/20 rounded-full blur-md -bottom-1 left-0" />
                        <div className="absolute w-3 h-3 bg-primary/20 rounded-full blur-sm -bottom-0.5 left-1.5" />
                      </div>
                    </motion.div>
                  )}
                </Link>
              )}
            </motion.div>
          );
        })}
      </motion.nav>
    </div>
  );
}