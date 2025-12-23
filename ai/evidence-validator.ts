/**
 * Evidence Validator
 * 
 * Waliduje czy odpowiedzi AI zawierają źródła dla wszystkich liczb/metryk/tez
 * zgodnie z Evidence Policy (Faza 05).
 */

import { MondaySource, extractMondaySources, formatSourceReference } from "@/lib/monday-link-generator";

export interface EvidenceItem {
  claim: string; // Teza/liczba która wymaga źródła
  source: MondaySource | null; // Źródło jeśli znalezione
  sourceType: "monday" | "slack" | "impactlog" | "none";
  itemId?: string | number;
  columnName?: string;
  link?: string;
}

export interface ValidationResult {
  validClaims: EvidenceItem[]; // Tezy ze źródłami
  unverifiedClaims: EvidenceItem[]; // Tezy bez źródeł (do potwierdzenia)
}

/**
 * Wyodrębnia liczby z tekstu
 * 
 * @param text - Tekst do analizy
 * @returns Tablica znalezionych liczb z kontekstem
 */
export function extractNumbers(text: string): Array<{ number: number; context: string }> {
  const numbers: Array<{ number: number; context: string }> = [];
  
  // Regex do znajdowania liczb (w tym z separatorami tysięcy)
  const numberRegex = /\b(\d{1,3}(?:\s?\d{3})*(?:[.,]\d+)?)\b/g;
  
  const lines = text.split("\n");
  
  for (const line of lines) {
    const matches = line.matchAll(numberRegex);
    for (const match of matches) {
      const numberStr = match[1].replace(/\s/g, "").replace(",", ".");
      const number = parseFloat(numberStr);
      
      if (!isNaN(number) && number > 0) {
        // Pobierz kontekst (20 znaków przed i po liczbie)
        const start = Math.max(0, match.index! - 20);
        const end = Math.min(line.length, match.index! + match[0].length + 20);
        const context = line.substring(start, end).trim();
        
        numbers.push({ number, context });
      }
    }
  }
  
  return numbers;
}

/**
 * Wyodrębnia tezy/fakty z tekstu (nie tylko liczby)
 * 
 * @param text - Tekst do analizy
 * @returns Tablica potencjalnych tez wymagających źródła
 */
export function extractClaims(text: string): string[] {
  const claims: string[] = [];
  
  // Wzorce które mogą wskazywać na fakty wymagające źródła:
  // - Liczby z jednostkami (np. "5000 beneficjentów")
  // - Fakty o projekcie (np. "projekt działa od 2023")
  // - Metryki (np. "osiągnął 40% wzrost")
  
  const lines = text.split("\n");
  
  for (const line of lines) {
    // Skip sekcje nagłówkowe
    if (line.match(/^##?\s+/)) {
      continue;
    }
    
    // Skip sekcję "Źródła" i "Do potwierdzenia"
    if (line.match(/^##?\s*(Źródła|Do potwierdzenia)/i)) {
      continue;
    }
    
    // Znajdź linie z liczbami (potencjalne metryki)
    if (line.match(/\d+/)) {
      claims.push(line.trim());
    }
    
    // Znajdź linie z faktami o projekcie (zawierają słowa kluczowe)
    const factKeywords = [
      "projekt",
      "osiągnął",
      "działa",
      "współpracuje",
      "realizuje",
      "beneficjent",
      "status",
      "geografia",
      "tematyka",
    ];
    
    const lowerLine = line.toLowerCase();
    if (factKeywords.some(keyword => lowerLine.includes(keyword))) {
      claims.push(line.trim());
    }
  }
  
  return claims.filter(claim => claim.length > 10); // Minimum długość tezy
}

/**
 * Szuka źródła dla danej tezy w wynikach narzędzi
 * 
 * @param claim - Teza do zweryfikowania
 * @param toolResults - Wyniki z narzędzi (Monday.com, Slack, etc.)
 * @returns Źródło jeśli znalezione, null jeśli nie
 */
export function findSourceForClaim(
  claim: string,
  toolResults: Record<string, any>
): EvidenceItem | null {
  // Szukaj w wynikach Monday.com
  for (const [toolName, result] of Object.entries(toolResults)) {
    if (toolName.includes("monday") || toolName.includes("board") || toolName.includes("item")) {
      // Wyodrębnij kolumnę z tezy jeśli możliwe
      const columnMatch = claim.match(/kolumna\s+["']([^"']+)["']/i);
      const columnName = columnMatch ? columnMatch[1] : undefined;
      
      const sources = extractMondaySources(result, columnName);
      
      if (sources && sources.length > 0) {
        const source = sources[0]; // Użyj pierwszego źródła
        return {
          claim,
          source,
          sourceType: "monday",
          itemId: source.itemId,
          columnName: source.columnName,
          link: formatSourceReference(source),
        };
      }
    }
  }
  
  // Jeśli nie znaleziono źródła, zwróć jako unverified
  return {
    claim,
    source: null,
    sourceType: "none",
  };
}

/**
 * Waliduje czy odpowiedź zawiera źródła dla wszystkich liczb/tez
 * 
 * @param responseText - Tekst odpowiedzi AI
 * @param toolResults - Wyniki z narzędzi użytych do generowania odpowiedzi
 * @returns Wynik walidacji z podziałem na zweryfikowane i niezweryfikowane tezy
 */
export function validateEvidence(
  responseText: string,
  toolResults: Record<string, any> = {}
): ValidationResult {
  const validClaims: EvidenceItem[] = [];
  const unverifiedClaims: EvidenceItem[] = [];
  
  // Wyodrębnij wszystkie tezy z odpowiedzi
  const claims = extractClaims(responseText);
  
  // Sprawdź czy odpowiedź już zawiera sekcję "Źródła"
  const hasSourcesSection = /^##?\s*Źródła/i.test(responseText);
  const hasUnverifiedSection = /^##?\s*Do potwierdzenia/i.test(responseText);
  
  // Jeśli odpowiedź już ma sekcję "Źródła", załóż że źródła są podane
  // (walidacja szczegółowa wymagałaby parsowania markdown)
  if (hasSourcesSection) {
    // Wyodrębnij tezy które mają źródła (z sekcji "Źródła")
    const sourcesSectionMatch = responseText.match(/^##?\s*Źródła[\s\S]*?(?=^##|$)/im);
    if (sourcesSectionMatch) {
      const sourcesSection = sourcesSectionMatch[0];
      // Znajdź wszystkie linki w sekcji źródeł
      const linkMatches = sourcesSection.matchAll(/\[([^\]]+)\]\(([^)]+)\)/g);
      for (const match of linkMatches) {
        const claimText = match[1];
        const link = match[2];
        
        // Znajdź odpowiadającą tezę w głównej treści
        const matchingClaim = claims.find(c => 
          c.toLowerCase().includes(claimText.toLowerCase().substring(0, 20))
        );
        
        if (matchingClaim) {
          validClaims.push({
            claim: matchingClaim,
            source: null, // Źródło jest w linku, nie parsujemy szczegółowo
            sourceType: link.includes("monday.com") ? "monday" : "none",
            link,
          });
        }
      }
    }
  }
  
  // Sprawdź tezy które nie mają źródeł
  for (const claim of claims) {
    // Pomiń jeśli już jest w validClaims
    if (validClaims.some(vc => vc.claim === claim)) {
      continue;
    }
    
    // Pomiń jeśli jest w sekcji "Do potwierdzenia" (już oznaczone)
    if (hasUnverifiedSection) {
      const unverifiedSectionMatch = responseText.match(/^##?\s*Do potwierdzenia[\s\S]*?(?=^##|$)/im);
      if (unverifiedSectionMatch && unverifiedSectionMatch[0].includes(claim)) {
        unverifiedClaims.push({
          claim,
          source: null,
          sourceType: "none",
        });
        continue;
      }
    }
    
    // Spróbuj znaleźć źródło w wynikach narzędzi
    const evidenceItem = findSourceForClaim(claim, toolResults);
    
    if (evidenceItem && evidenceItem.source) {
      validClaims.push(evidenceItem);
    } else {
      // Jeśli nie znaleziono źródła, dodaj do unverified
      unverifiedClaims.push({
        claim,
        source: null,
        sourceType: "none",
      });
    }
  }
  
  return {
    validClaims,
    unverifiedClaims,
  };
}

/**
 * Formatuje sekcję "Źródła" dla odpowiedzi
 * 
 * @param validClaims - Zweryfikowane tezy ze źródłami
 * @returns Sformatowana sekcja "Źródła" w markdown
 */
export function formatSourcesSection(validClaims: EvidenceItem[]): string {
  if (validClaims.length === 0) {
    return "";
  }
  
  const lines = ["## Źródła", ""];
  
  for (const claim of validClaims) {
    if (claim.link) {
      lines.push(`- "${claim.claim}" → ${claim.link}`);
    } else if (claim.source) {
      lines.push(`- "${claim.claim}" → ${formatSourceReference(claim.source)}`);
    }
  }
  
  return lines.join("\n");
}

/**
 * Formatuje sekcję "Do potwierdzenia" dla odpowiedzi
 * 
 * @param unverifiedClaims - Niezweryfikowane tezy
 * @returns Sformatowana sekcja "Do potwierdzenia" w markdown
 */
export function formatUnverifiedSection(unverifiedClaims: EvidenceItem[]): string {
  if (unverifiedClaims.length === 0) {
    return "";
  }
  
  const lines = ["## Do potwierdzenia", ""];
  
  for (const claim of unverifiedClaims) {
    // Wyodrębnij potencjalną kolumnę z tezy
    const columnMatch = claim.claim.match(/(beneficjent|projekt|status|geografia|tematyka|budżet|progres)/i);
    const suggestedColumn = columnMatch ? columnMatch[1] : "odpowiednie pole";
    
    lines.push(
      `⚠️ Brak źródła: "${claim.claim}" — proszę zweryfikować w Monday kolumnie "${suggestedColumn}"`
    );
  }
  
  return lines.join("\n");
}

