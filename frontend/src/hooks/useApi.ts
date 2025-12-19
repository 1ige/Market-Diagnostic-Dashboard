import { useState, useEffect } from "react";

// Use proxy through Vite dev server to avoid CORS and network issues
// All /api/* requests will be proxied to the backend container
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Use relative /api path which Vite will proxy to backend
  // This works from any device on the network accessing the frontend
  return '/api';
};

const API_URL = getApiUrl();
console.log('API_URL configured as:', API_URL);

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    const url = `${API_URL}${endpoint}`;
    console.log('Fetching from:', url);
    fetch(url)
      .then((res) => {
        console.log('Response status:', res.status, 'for', endpoint);
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((result) => {
        console.log('Data received for', endpoint, ':', Array.isArray(result) ? `${result.length} items` : 'object');
        setData(result);
      })
      .catch((err) => {
        console.error('Fetch error for', endpoint, ':', err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (endpoint) {
      fetchData();
    }
  }, [endpoint, refetchTrigger]);

  const refetch = () => {
    setRefetchTrigger(prev => prev + 1);
  };

  return { data, loading, error, refetch };
}