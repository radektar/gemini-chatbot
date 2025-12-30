"use client";

import { Button } from "@/components/ui/button";

interface ClarificationSuggestionsProps {
  content: string;
  onAppendMessage?: (message: { role: "user"; content: string }) => Promise<void>;
}

/**
 * Extracts suggestions from AI response text
 * Looks for patterns like:
 * - "(np. "projekty w trakcie", "projekty opóźnione")"
 * - "np. "projekty w trakcie", "projekty opóźnione""
 * - Text in quotes after "np."
 */
function extractSuggestions(content: string): string[] {
  const suggestions: string[] = [];
  
  // Pattern 1: (np. "suggestion1", "suggestion2")
  const pattern1 = /\(np\.\s*"([^"]+)"(?:\s*,\s*"([^"]+)")*\)/gi;
  let match;
  
  while ((match = pattern1.exec(content)) !== null) {
    // Extract all quoted strings from the match
    const quotedMatches = match[0].match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach((q) => {
        const suggestion = q.replace(/"/g, "").trim();
        if (suggestion) {
          suggestions.push(suggestion);
        }
      });
    }
  }
  
  // Pattern 2: np. "suggestion1", "suggestion2" (without parentheses)
  const pattern2 = /np\.\s*"([^"]+)"(?:\s*,\s*"([^"]+)")*/gi;
  while ((match = pattern2.exec(content)) !== null) {
    const quotedMatches = match[0].match(/"([^"]+)"/g);
    if (quotedMatches) {
      quotedMatches.forEach((q) => {
        const suggestion = q.replace(/"/g, "").trim();
        if (suggestion && !suggestions.includes(suggestion)) {
          suggestions.push(suggestion);
        }
      });
    }
  }
  
  // Pattern 3: Look for any quoted text that might be suggestions
  // This is a fallback for less structured responses
  if (suggestions.length === 0) {
    const allQuoted = content.match(/"([^"]+)"/g);
    if (allQuoted && allQuoted.length <= 5) {
      // Only use if there are a reasonable number of quotes (likely suggestions)
      allQuoted.forEach((q) => {
        const suggestion = q.replace(/"/g, "").trim();
        // Filter out very short or very long suggestions
        if (suggestion.length > 3 && suggestion.length < 100) {
          suggestions.push(suggestion);
        }
      });
    }
  }
  
  return suggestions.slice(0, 5); // Limit to 5 suggestions
}

export function ClarificationSuggestions({
  content,
  onAppendMessage,
}: ClarificationSuggestionsProps) {
  const suggestions = extractSuggestions(content);
  
  if (suggestions.length === 0 || !onAppendMessage) {
    return null;
  }
  
  const handleSuggestionClick = async (suggestion: string) => {
    if (onAppendMessage) {
      await onAppendMessage({
        role: "user",
        content: suggestion,
      });
    }
  };
  
  return (
    <div className="flex flex-col gap-2 mt-3">
      <p className="text-sm text-tttr-text-caption font-secondary">Możesz wybrać:</p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="secondary"
            size="sm"
            onClick={() => handleSuggestionClick(suggestion)}
            className="text-sm font-secondary bg-tttr-beige-mid hover:bg-tttr-beige text-tttr-text-paragraph border-0 rounded-tttr-8"
          >
            {suggestion}
          </Button>
        ))}
      </div>
    </div>
  );
}

