import { useState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/input";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

interface LocationSuggestion {
  display_name: string;
  lat: string;
  lon: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onCoordinatesChange?: (lat: number, lng: number) => void;
  onDetectLocation?: () => void;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
}

export const LocationAutocomplete = ({
  value,
  onChange,
  onCoordinatesChange,
  onDetectLocation,
  placeholder = "Ex: Dakar, Sénégal",
  className,
  error,
  disabled = false,
}: LocationAutocompleteProps) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Fermer les suggestions quand on clique en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Rechercher des suggestions quand l'utilisateur tape
  useEffect(() => {
    const fetchSuggestions = async () => {
      if (value.length < 2) {
        setSuggestions([]);
        return;
      }

      setIsLoading(true);
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(
            value
          )}&format=json&limit=5&addressdetails=1`
        );
        const data = await response.json();
        
        // Formater les suggestions pour n'afficher que ville, pays
        const formatted = data.map((item: any) => ({
          display_name: `${item.address?.city || item.address?.town || item.address?.village || item.display_name.split(',')[0]}, ${item.address?.country || ''}`.trim(),
          lat: item.lat,
          lon: item.lon,
        }));
        
        // Dédupliquer les suggestions par display_name
        const uniqueSuggestions = formatted.filter((suggestion: LocationSuggestion, index: number, self: LocationSuggestion[]) =>
          index === self.findIndex((s) => s.display_name === suggestion.display_name)
        );
        
        setSuggestions(uniqueSuggestions);
        setShowSuggestions(true);
      } catch (error) {
        console.error("Error fetching location suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounceTimer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounceTimer);
  }, [value]);

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    onChange(suggestion.display_name);
    if (onCoordinatesChange) {
      onCoordinatesChange(parseFloat(suggestion.lat), parseFloat(suggestion.lon));
    }
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
    setShowSuggestions(true);
  };

  return (
    <div ref={wrapperRef} className="relative">
      <div className="relative">
        <Input
          value={value}
          onChange={handleInputChange}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className={cn(className, error && "border-destructive")}
          disabled={disabled}
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          </div>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md">
          <div className="max-h-60 overflow-auto p-1">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors text-left"
              >
                <MapPin className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                <span className="flex-1">{suggestion.display_name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}
    </div>
  );
};
