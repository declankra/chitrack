// src/components/search/SearchBar.tsx
"use client";

import React, { useState, useEffect } from 'react';
import { searchStations, type Station } from '@/lib/data/stations';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

interface SearchBarProps {
  onStationSelect: (station: Station) => void;
}

export default function SearchBar({ onStationSelect }: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Station[]>([]);

  // Update search results when query changes
  useEffect(() => {
    if (query.trim()) {
      setResults(searchStations(query));
    } else {
      setResults([]);
    }
  }, [query]);

  return (
    <div className="w-full space-y-2">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for a station..."
          className="h-10 w-full rounded-md border border-input pl-9 pr-4 text-sm"
        />
      </div>

      {/* Results List */}
      {results.length > 0 && (
        <Card className="w-full overflow-hidden">
          <ul className="divide-y">
            {results.map((station) => (
              <li
                key={station.staId}
                onClick={() => onStationSelect(station)}
                className="cursor-pointer p-3 hover:bg-accent transition-colors"
              >
                <div className="font-medium">{station.staNm}</div>
                <div className="text-xs text-muted-foreground">
                  {station.routes.join(' • ')}
                </div>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}