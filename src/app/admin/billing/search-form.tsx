"use client";

import { useState, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  name: string | null;
}

interface SearchFormProps {
  onUserSelect: (userId: string) => void;
}

export function SearchForm({ onUserSelect }: SearchFormProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/admin/billing/search?q=${encodeURIComponent(query)}`
        );
        if (!response.ok) throw new Error("Search failed");
        const data = await response.json();
        setResults(data.users || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search User
        </label>
        <input
          type="text"
          placeholder="Search by email or user ID..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {error && (
        <Card className="p-4 bg-red-50 border-red-200">
          <p className="text-sm text-red-800">{error}</p>
        </Card>
      )}

      {loading && (
        <Card className="p-4">
          <p className="text-sm text-gray-600">Searching...</p>
        </Card>
      )}

      {!loading && query.length >= 2 && results.length === 0 && (
        <Card className="p-4">
          <p className="text-sm text-gray-600">No users found</p>
        </Card>
      )}

      {results.length > 0 && (
        <Card className="p-4">
          <p className="text-sm font-medium text-gray-700 mb-3">
            Found {results.length} user{results.length !== 1 ? "s" : ""}
          </p>
          <div className="space-y-2">
            {results.map((user) => (
              <button
                key={user.id}
                onClick={() => onUserSelect(user.id)}
                className="w-full text-left p-3 rounded-lg border border-gray-200 hover:bg-blue-50 hover:border-blue-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{user.email}</p>
                    {user.name && (
                      <p className="text-sm text-gray-600">{user.name}</p>
                    )}
                    <p className="text-xs text-gray-500 font-mono mt-1">
                      {user.id}
                    </p>
                  </div>
                  <span className="text-blue-600 text-sm font-medium">
                    View →
                  </span>
                </div>
              </button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
