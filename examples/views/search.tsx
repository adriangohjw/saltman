import React from "react";

interface SearchResultsProps {
  searchQuery: string;
}

// VULNERABLE: Reflected XSS - user input rendered without sanitization
export function SearchResults({ searchQuery }: SearchResultsProps) {
  return (
    <div>
      <h1>Search Results</h1>
      {/* Dangerous: Directly rendering user input */}
      <div dangerouslySetInnerHTML={{ __html: `Search results for: ${searchQuery}` }} />
      
      {/* Also vulnerable: Direct interpolation in JSX */}
      <p>You searched for: {searchQuery}</p>
    </div>
  );
}

