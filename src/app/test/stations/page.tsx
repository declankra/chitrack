'use client';

import { useState } from 'react';
import { testAllStationArrivals } from '@/lib/data/test_stations';

export default function TestStationsPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await testAllStationArrivals();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Station API Test</h1>
      
      {results?.metadata && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total stations available: {results.metadata.totalStations}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Tested station ID: {results.metadata.testedStation}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-500">View All Station IDs</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(results.stationIds, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button
        onClick={runTest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test Random Station'}
      </button>

      {error && (
        <div className="mt-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      {results?.data && (
        <div className="mt-4">
          <h2 className="text-xl font-semibold mb-2">Results:</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto max-h-[500px]">
            {JSON.stringify(results.data, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 