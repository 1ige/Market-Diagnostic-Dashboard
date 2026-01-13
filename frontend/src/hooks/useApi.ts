import { useState, useEffect } from "react";
import { buildApiUrl } from "../utils/apiUtils";
import { loadingStore } from "../utils/loadingStore";

export function useApi<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  const fetchData = () => {
    setLoading(true);
    setError(null);
    loadingStore.start();
    const url = buildApiUrl(endpoint);
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
      .finally(() => {
        setLoading(false);
        loadingStore.stop();
      });
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
