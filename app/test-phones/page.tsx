'use client';

import { useState, useEffect } from 'react';

export default function TestPhonesPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/phones');
      const result = await response.json();
      setData(result);
      console.log('API Response:', result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Phone Data Test</h1>
      <button 
        onClick={fetchData}
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
      >
        Refresh Data
      </button>
      
      <div className="mb-4">
        <strong>Success:</strong> {data?.success?.toString()}
      </div>
      
      <div className="mb-4">
        <strong>Total:</strong> {data?.total}
      </div>
      
      <div className="mb-4">
        <strong>Phones Count:</strong> {data?.phones?.length || 0}
      </div>
      
      <div className="mb-4">
        <strong>First 3 Phones:</strong>
        <pre className="bg-gray-100 p-2 mt-2 text-sm">
          {JSON.stringify(data?.phones?.slice(0, 3), null, 2)}
        </pre>
      </div>
      
      <div>
        <strong>Raw Response:</strong>
        <pre className="bg-gray-100 p-2 mt-2 text-sm overflow-auto max-h-96">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>
    </div>
  );
} 