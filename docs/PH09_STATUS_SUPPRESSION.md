# Faza 09 — UI Status Messages Suppression

## Cel

Ukrycie wewnętrznych statusów pracy AI (np. "Zaraz sprawdzę...", "Teraz pobiorę...", "Świetnie! Znalazłem...") od użytkownika końcowego.

## Problem

Model AI (Claude) generuje komunikaty statusowe podczas pracy z narzędziami, mimo że system prompt zawiera szczegółowe instrukcje, aby tego nie robić. Te wiadomości:
- Zaśmiecają interfejs użytkownika
- Nie wnoszą wartości merytorycznej
- Są redundantne (UI już pokazuje "System pracuje...")
- Mogą być mylące dla użytkownika

### Przykłady problematycznych wiadomości

```
❌ "Zaraz sprawdzę wszystkie projekty z workspace 'Main workspace':"
❌ "Świetnie! Znalazłem wszystkie projekty. Teraz pobiorę szczegóły z każdego boardu:"
❌ "Rozumiem - mam ograniczony dostęp do konkretnego boardu. Pozwól, że sprawdzę, do którego boardu mam dostęp:"
❌ "Teraz sprawdzę wszystkie workspace'i..."
```

## Rozwiązanie

### Strategia: Rozszerzone Client-Side Filtering

Na podstawie badań (Perplexity Research), najskuteczniejsze rozwiązanie to **client-side filtering** w komponencie `message.tsx`:

1. **Ukrywanie statusów ZAWSZE** — nie tylko podczas aktywnych tool invocations
2. **Rozszerzone wzorce statusowe** — pokrywające wszystkie warianty
3. **Warunek długości** — krótkie wiadomości (<200 znaków) bez merytoryki to statusy

### Dlaczego nie server-side?

- Vercel AI SDK 3.x nie wspiera dobrze `experimental_transform`
- Client-side filtering jest szybsze do implementacji i równie skuteczne
- System prompt już jest maksymalnie zoptymalizowany — problem leży w zachowaniu modelu

## Implementacja

### 1. Zmiany w `components/custom/message.tsx`

#### Obecny kod (WADLIWY):

```typescript
// Problem: ukrywa statusy tylko gdy tool invocations są aktywne
const shouldHideContent = role === "assistant" && 
  typeof content === "string" && 
  isStatusMessage(content) &&
  toolInvocations && 
  toolInvocations.some(inv => inv.state !== "result"); // ← to blokuje ukrywanie po zakończeniu
```

#### Nowy kod (POPRAWIONY):

```typescript
// Rozszerzona lista wzorców statusowych
const isStatusMessage = (content: string): boolean => {
  if (!content || typeof content !== "string") return false;
  
  const statusPatterns = [
    // Początek zdania - status działania
    /^zaraz\s+/i,
    /^teraz\s+/i,
    /^rozumiem\s+/i,
    /^pozwól\s+/i,
    /^znalazłem\s+/i,
    /^sprawdzę\s+/i,
    /^pobiorę\s+/i,
    /^szukam\s+/i,
    /^najpierw\s+/i,
    /^świetnie[!.]?\s+/i,
    /^dobrze[!.]?\s+/i,
    /^ok[!.]?\s+/i,
    
    // Frazy w środku zdania
    /teraz\s+sprawdzę/i,
    /zaraz\s+sprawdzę/i,
    /teraz\s+pobiorę/i,
    /zaraz\s+pobiorę/i,
    /sprawdzę\s+dostępną/i,
    /znalazłem\s+tablicę/i,
    /znalazłem\s+wszystkie/i,
    /mam\s+ograniczony\s+dostęp/i,
    /do\s+którego\s+boardu/i,
    /z\s+workspace/i,
    /z\s+każdego\s+boardu/i,
    
    // Nowe wzorce na podstawie logów
    /szczegóły\s+z\s+każdego/i,
    /projekty\s+z\s+workspace/i,
    /sprawdzę.*dostęp/i,
  ];
  
  // Warunek: krótka wiadomość + zawiera wzorzec statusowy
  const isShortStatusOnly = content.length < 200 && 
    statusPatterns.some(pattern => pattern.test(content.trim()));
  
  return isShortStatusOnly;
};

// KLUCZOWA ZMIANA: Usunięcie warunku tool invocations state
const shouldHideContent = role === "assistant" && 
  typeof content === "string" && 
  isStatusMessage(content);
// Usunięto: && toolInvocations && toolInvocations.some(inv => inv.state !== "result")
```

### 2. Synchronizacja z `app/(chat)/api/chat/route.ts`

Funkcja `isStatusMessage` w API route powinna być zsynchronizowana z komponentem. Obecnie obie funkcje mają tę samą logikę, ale API route dodatkowo filtruje statusy przed zapisem do bazy danych w `onFinish`.

### 3. Opcjonalnie: CSS Transition (eliminacja migotania)

```css
/* W app/globals.css */
.message-content {
  transition: opacity 0.15s ease-in-out, height 0.15s ease-in-out;
}

.message-content.hidden {
  opacity: 0;
  height: 0;
  overflow: hidden;
  margin: 0;
  padding: 0;
}
```

## Pliki do modyfikacji

| Plik | Zmiana |
|------|--------|
| `components/custom/message.tsx` | Rozszerzona funkcja `isStatusMessage()`, usunięcie warunku `toolInvocations.state` |
| `app/(chat)/api/chat/route.ts` | Synchronizacja wzorców w funkcji `isStatusMessage()` |
| `app/globals.css` | (opcjonalnie) CSS transition dla smooth hiding |
| `tests/status-suppression.test.ts` | Nowe testy dla logiki filtrowania |

## Testy

### Testy automatyczne (`tests/status-suppression.test.ts`)

```typescript
import { describe, it, expect } from 'vitest';

// Importuj funkcję isStatusMessage
const isStatusMessage = (content: string): boolean => {
  // ... implementacja
};

describe('Status Message Detection', () => {
  it('should detect "Zaraz sprawdzę" as status', () => {
    expect(isStatusMessage('Zaraz sprawdzę wszystkie projekty')).toBe(true);
  });
  
  it('should detect "Świetnie! Znalazłem" as status', () => {
    expect(isStatusMessage('Świetnie! Znalazłem wszystkie projekty.')).toBe(true);
  });
  
  it('should detect "z workspace" pattern as status', () => {
    expect(isStatusMessage('Teraz pobiorę dane z workspace Main')).toBe(true);
  });
  
  it('should NOT hide long responses with real content', () => {
    const longContent = 'Oto wyniki wyszukiwania projektów w Kenii: ' + 
      '1. Projekt ABC - status: aktywny, beneficjenci: 5000... ' +
      '2. Projekt XYZ - status: zakończony, beneficjenci: 3000... ' +
      'Łącznie znaleziono 15 projektów spełniających kryteria.';
    expect(isStatusMessage(longContent)).toBe(false);
  });
  
  it('should NOT hide responses starting with results', () => {
    expect(isStatusMessage('Oto wszystkie projekty z Kenii:')).toBe(false);
  });
});
```

### Testy manualne

| Scenariusz | Oczekiwany wynik |
|------------|-----------------|
| Zapytaj "Pokaż projekty z Kenii" | Tylko typing indicator podczas pracy, potem wyniki |
| Zapytaj o dane wymagające wielu tool calls | Brak statusów pośrednich, tylko finalna odpowiedź |
| Odśwież stronę po rozmowie | Historia nie zawiera statusowych wiadomości |
| Sprawdź w DevTools Network | Statusy mogą być w strumieniu, ale nie w UI |

## Metryki sukcesu

- [ ] Brak wiadomości zaczynających się od "Zaraz", "Teraz", "Rozumiem", "Pozwól", "Świetnie" w UI
- [ ] Typing indicator widoczny podczas pracy systemu
- [ ] Finalna odpowiedź zawiera tylko merytoryczną treść
- [ ] Historia czatu czysta (bez statusów)
- [ ] Wszystkie testy automatyczne przechodzą

## Alternatywne podejścia (odrzucone)

### 1. Server-side stream transformation
- **Problem**: Vercel AI SDK 3.x nie wspiera `experimental_transform` w sposób stabilny
- **Status**: Odrzucone

### 2. Zmiana system prompt
- **Problem**: System prompt już jest maksymalnie zoptymalizowany z wielokrotnymi instrukcjami
- **Status**: Już zaimplementowane, ale niewystarczające — model nadal generuje statusy

### 3. Zmiana modelu AI
- **Problem**: Wymaga znacznych zmian w architekturze
- **Status**: Poza zakresem tej fazy

## Referencje

- [Perplexity Research: Suppressing Internal Status Messages](https://perplexity.ai) — badanie best practices
- [Vercel AI SDK: Stream Protocol](https://ai-sdk.dev/docs/ai-sdk-ui/stream-protocol)
- [Lost in the Middle Paper](https://arxiv.org/abs/2307.03172) — research o kontekście LLM

