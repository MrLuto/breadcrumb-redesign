import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { Loader2, Building2, Search } from 'lucide-react';
import { useCompanyLookup, CompanyResult } from '@/hooks/useCompanyLookup';
import { cn } from '@/lib/utils';

interface CompanySearchProps {
  value: string;
  onChange: (value: string) => void;
  onCompanySelect: (company: CompanyResult) => void;
  disabled?: boolean;
}

export function CompanySearch({ value, onChange, onCompanySelect, disabled }: CompanySearchProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isSearching, results, searchCompanies, clearResults } = useCompanyLookup();

  // Debounced search
  useEffect(() => {
    if (searchTimeout) clearTimeout(searchTimeout);

    if (value.length >= 2) {
      const timeout = setTimeout(() => {
        searchCompanies(value);
        setShowDropdown(true);
      }, 300);
      setSearchTimeout(timeout);
    } else {
      clearResults();
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeout) clearTimeout(searchTimeout);
    };
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (company: CompanyResult) => {
    onChange(company.name);
    onCompanySelect(company);
    setShowDropdown(false);
    clearResults();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <div className="relative">
        <Input
          ref={inputRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Zoek op bedrijfsnaam..."
          disabled={disabled}
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isSearching ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : (
            <Search className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {showDropdown && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {results.map((company, index) => (
            <button
              key={`${company.kvkNumber}-${index}`}
              type="button"
              onClick={() => handleSelect(company)}
              className={cn(
                "w-full px-4 py-3 text-left hover:bg-muted transition-colors",
                index !== results.length - 1 && "border-b border-border"
              )}
            >
              <div className="flex items-start gap-3">
                <Building2 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate">{company.name}</p>
                  <p className="text-sm text-muted-foreground truncate">
                    {company.address && `${company.address}, `}
                    {company.postcode} {company.city}
                  </p>
                  {company.kvkNumber && (
                    <p className="text-xs text-muted-foreground">KVK: {company.kvkNumber}</p>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {showDropdown && !isSearching && results.length === 0 && value.length >= 2 && (
        <div className="absolute z-50 w-full mt-1 bg-card border border-border rounded-lg shadow-lg p-4 text-center text-muted-foreground">
          <p>Geen bedrijven gevonden</p>
          <p className="text-sm mt-1">Vul de gegevens handmatig in</p>
        </div>
      )}
    </div>
  );
}