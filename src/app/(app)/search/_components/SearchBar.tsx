// src/components/search/SearchBar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { type Station } from '@/lib/data/stations';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';
import { useStations } from '@/lib/hooks/useStations';

interface SearchBarProps {
  onStationSelect: (station: Station) => void;
}

// Search stations by name
export async function searchStations(query: string, stations: Station[]): Promise<Station[]> {
  const normalizedQuery = query.toLowerCase().trim();
  return stations.filter(station => 
      station.stationName.toLowerCase().includes(normalizedQuery)
  );
}

export default function SearchBar({ onStationSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);
  const { data: stations = [] } = useStations();

  // Update search results when query changes
  useEffect(() => {
    const fetchResults = async () => {
      if (query.trim()) {
        const searchResults = await searchStations(query, stations);
        setResults(searchResults);
      } else {
        setResults([]);
      }
    };
    
    fetchResults();
  }, [query, stations]);

  return (
    <div className="w-full space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Start typing"
          className="h-10 w-full rounded-md border border-input pl-9 pr-4 text-sm"
        />
      </div>

      {/* Results List */}
      {results.length > 0 && (
        <Card className="w-full overflow-hidden">
          <ul className="divide-y">
            {results.map((station) => (
              <li
                key={station.stationId}
                onClick={() => onStationSelect(station)}
                className="cursor-pointer p-3 hover:bg-accent transition-colors"
              >
                <div className="font-medium">{station.stationName}</div>
                <div className="text-xs text-muted-foreground">
                  {station.stops.map(stop => stop.directionName).filter(Boolean).join(' • ')}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}