import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyResult {
  name: string;
  kvkNumber: string;
  address: string;
  postcode: string;
  city: string;
}

export function useCompanyLookup() {
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<CompanyResult[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchCompanies = useCallback(async (query: string) => {
    if (query.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('lookup-company', {
        body: { query },
      });

      if (fnError) throw fnError;

      setResults(data.companies || []);
    } catch (err) {
      console.error('Company lookup error:', err);
      setError('Kon geen bedrijfsgegevens ophalen');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
    setError(null);
  }, []);

  return {
    isSearching,
    results,
    error,
    searchCompanies,
    clearResults,
  };
}