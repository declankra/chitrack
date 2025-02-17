"use client";

import React, { useState } from 'react';
import SearchBar from '@/app/(app)/search/_components/SearchBar';
import ArrivalBoard from '@/app/(app)/search/_components/ArrivalBoard';
import type { Station } from '@/lib/data/stations';

export default function Search() {
  const [selectedStation, setSelectedStation] = useState<Station | null>(null);

  return (
    <div className="space-y-4">
      {/* Search Instructions */}
      {!selectedStation && (
        <div className="mb-6">
          <h1 className="text-xl font-semibold mb-2">Find a Station</h1>
          <p className="text-sm text-muted-foreground">
            Search for any CTA train station to see upcoming arrivals
          </p>
        </div>
      )}

      {/* Search Bar */}
      <SearchBar onStationSelect={setSelectedStation} />

      {/* Arrival Board */}
      {selectedStation && (
        <ArrivalBoard
          station={selectedStation}
          onClose={() => setSelectedStation(null)}
        />
      )}
    </div>
  );
}