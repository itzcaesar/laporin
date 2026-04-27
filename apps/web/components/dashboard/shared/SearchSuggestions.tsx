"use client";

import { useEffect, useState } from "react";
import { Search, Clock } from "lucide-react";
import { api } from "@/lib/api-client";

interface SearchSuggestionsProps {
  query: string;
  onSelect: (suggestion: string) => void;
  onSubmit: () => void;
}

interface Suggestion {
  text: string;
  type: "report" | "category" | "location";
}

export function SearchSuggestions({ query, onSelect, onSubmit }: SearchSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        // Fetch recent reports matching the query
        const response = await api.get<any>(`/reports?search=${encodeURIComponent(query)}&limit=5`);
        
        const reportSuggestions: Suggestion[] = [];
        const seenTexts = new Set<string>();

        if (response.success && response.data) {
          // Add report titles
          response.data.forEach((report: any) => {
            if (report.title && !seenTexts.has(report.title.toLowerCase())) {
              reportSuggestions.push({
                text: report.title,
                type: "report"
              });
              seenTexts.add(report.title.toLowerCase());
            }
          });

          // Add unique categories
          response.data.forEach((report: any) => {
            if (report.categoryName && !seenTexts.has(report.categoryName.toLowerCase())) {
              reportSuggestions.push({
                text: report.categoryName,
                type: "category"
              });
              seenTexts.add(report.categoryName.toLowerCase());
            }
          });

          // Add unique locations
          response.data.forEach((report: any) => {
            if (report.locationAddress) {
              const location = report.locationAddress.split(',')[0].trim();
              if (!seenTexts.has(location.toLowerCase())) {
                reportSuggestions.push({
                  text: location,
                  type: "location"
                });
                seenTexts.add(location.toLowerCase());
              }
            }
          });
        }

        setSuggestions(reportSuggestions.slice(0, 8));
        setIsOpen(reportSuggestions.length > 0);
      } catch (error) {
        console.error("Failed to fetch suggestions:", error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    const debounce = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(debounce);
  }, [query]);

  if (!isOpen || suggestions.length === 0) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case "report":
        return <Search size={14} className="text-muted" />;
      case "category":
        return <span className="text-muted">🏷️</span>;
      case "location":
        return <span className="text-muted">📍</span>;
      default:
        return <Clock size={14} className="text-muted" />;
    }
  };

  return (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-96 overflow-y-auto">
      {isLoading && suggestions.length === 0 ? (
        <div className="px-4 py-3 text-sm text-muted">Mencari...</div>
      ) : (
        <>
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => {
                onSelect(suggestion.text);
                setIsOpen(false);
                setTimeout(onSubmit, 100);
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-surface transition-colors flex items-center gap-3 group"
            >
              <span className="flex-shrink-0">{getIcon(suggestion.type)}</span>
              <span className="text-ink flex-1 truncate group-hover:text-blue">
                {suggestion.text}
              </span>
              {suggestion.type === "category" && (
                <span className="text-xs text-muted">Kategori</span>
              )}
              {suggestion.type === "location" && (
                <span className="text-xs text-muted">Lokasi</span>
              )}
            </button>
          ))}
        </>
      )}
    </div>
  );
}
