import { Search } from "lucide-react";
import { useCallback, useMemo, useEffect } from "react";
import debounce from "lodash/debounce";

interface AreaSearchProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
}

export function AreaSearch({ searchQuery, onSearchChange }: AreaSearchProps) {
  // Memoize the debounced function
  const debouncedSearch = useMemo(
    () => debounce((value: string) => onSearchChange(value), 300),
    [onSearchChange]
  );

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      debouncedSearch.cancel();
    };
  }, [debouncedSearch]);

  // Handler for input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    debouncedSearch(value);
  }, [debouncedSearch]);

  return (
    <div className="relative flex-1">
      <input
        type="text"
        placeholder="Cari area..."
        defaultValue={searchQuery}
        onChange={handleInputChange}
        className="w-full p-3 rounded-xl bg-[#e0e5ec] shadow-[inset_4px_4px_10px_#bebebe,inset_-4px_-4px_10px_#ffffff] outline-none transition-all duration-300 focus:shadow-[inset_6px_6px_12px_#bebebe,inset_-6px_-6px_12px_#ffffff]"
      />
      <Search 
        className="absolute right-3 top-3 text-gray-600 transition-opacity duration-300" 
        size={20} 
      />
    </div>
  );
}
