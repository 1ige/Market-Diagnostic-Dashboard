import { useState, useEffect } from "react";

// Use the same host as the frontend, but port 8000 for API
// This allows external users to access the API on your public IP
const getApiUrl = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const protocol = window.location.protocol;
  const hostname = window.location.hostname;
  return `${protocol}//${hostname}:8000`;
};

const API_URL = getApiUrl();

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