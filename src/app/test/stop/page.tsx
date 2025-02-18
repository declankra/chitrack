// src/app/test/stop/page.tsx
'use client';

import { useState } from 'react';
import { testStopArrivals } from '@/lib/data/test_stops';

export default function TestStopPage() {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await testStopArrivals();
      setResults(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Stop API Test</h1>
      
      {results?.metadata && (
        <div className="mb-4">
          <p className="text-sm text-gray-600">
            Total stops available: {results.metadata.totalStops}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Tested stop ID: {results.metadata.testedStop}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            Stop name: {results.metadata.stopName}
          </p>
          <details className="mt-2">
            <summary className="cursor-pointer text-blue-500">View All Stop IDs</summary>
            <pre className="mt-2 bg-gray-100 p-2 rounded text-sm">
              {JSON.stringify(results.stopIds, null, 2)}
            </pre>
          </details>
        </div>
      )}

      <button
        onClick={runTest}
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded disabled:bg-gray-400"
      >
        {loading ? 'Testing...' : 'Test Random Stop'}
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