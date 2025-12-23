# Faza 04 - Instrukcje Testów Manualnych (Co mogę zweryfikować automatycznie)

**Data:** 2025-01-27  
**Wersja:** [0.2.0]  
**Branch:** `phase/04-plan-first`

---

## Co mogę zweryfikować automatycznie

### ✅ Sprawdzenie kodu źródłowego

1. **Intent Extraction** - kod jest poprawny ✅
   - `ai/intent-extraction.ts` - implementacja używa `generateObject` z Gemini
   - `app/(chat)/api/chat/route.ts` - wywołanie `extractIntent()` w linii 46
   - Confidence threshold: `process.env.CONFIDENCE_THRESHOLD || "0.7"` (linia 35-36)

2. **Plan Generation** - kod jest poprawny ✅
   - `ai/plan-generator.ts` - implementacja używa `generateText` z Gemini
   - `app/(chat)/api/chat/route.ts` - wywołanie `generatePlan()` w linii 76
   - Plan jest dodawany do system prompt (linia 213-214)

3. **Stop & Ask Triggers** - kod jest poprawny ✅
   - `app/(chat)/api/chat/route.ts` - trigger dla >100 rekordów (linie 165-180)
   - Obsługa różnych struktur odpowiedzi (items, boards, direct array)

4. **Feedback API** - kod jest poprawny ✅
   - `app/(chat)/api/feedback/route.ts` - walidacja rating (1 lub -1)
   - Wymaganie autoryzacji (linia 18)
   - Serializacja toolsUsed

5. **FeedbackButtons Component** - kod jest poprawny ✅
   - `components/custom/feedback-buttons.tsx` - wszystkie stany zaimplementowane
   - Pole komentarza dla 👎 (linie 103-133)
   - Anulowanie komentarza (linie 123-130)
   - Stan submitted z komunikatem (linie 72-78)

6. **Message Component** - kod jest poprawny ✅
   - `components/custom/message.tsx` - FeedbackButtons renderowane tylko dla `role === "assistant"` (linia 114)
   - Przekazywanie props: userQuery, assistantResponse, toolsUsed

---

## Co wymaga testów manualnych w przeglądarce

### 🔍 Scenariusze wymagające interakcji z UI

#### Część A: Intent Extraction + Confidence-based Prompting

**Scenariusz A1: Jasne zapytanie**
- **Co sprawdzić**: 
  - Wpisać: "Znajdź projekt edukacyjny w Kenii dla donora"
  - Sprawdzić czy system NIE pyta o doprecyzowanie
  - Sprawdzić czy plan jest prezentowany w odpowiedzi
  - Sprawdzić czy plan zawiera informacje o narzędziach Monday.com MCP
  - Sprawdzić czy plan zawiera filtry (geografia: Kenia, temat: edukacja)
  - Sprawdzić czy plan zawiera odbiorcę (donor)
  - Sprawdzić czy plan zawiera pytanie "Czy chcesz coś zmienić w tym planie?"
  - Sprawdzić czy narzędzia są uruchamiane po prezentacji planu

**Scenariusz A2: Niejasne zapytanie**
- **Co sprawdzić**:
  - Wpisać: "Coś o projektach"
  - Sprawdzić czy system pyta o doprecyzowanie
  - Sprawdzić czy pytanie zawiera listę slotów z niską confidence
  - Sprawdzić czy plan NIE jest generowany przed doprecyzowaniem
  - Po doprecyzowaniu: sprawdzić czy plan jest generowany

**Scenariusz A3: Różne poziomy confidence**
- **Test Case 3.1**: Wysoka confidence (0.9)
  - Zapytanie: "Znajdź projekty edukacyjne w Kenii dla donora w formie narracji"
  - Oczekiwany wynik: Brak pytań, plan generowany
- **Test Case 3.2**: Średnia confidence (0.6)
  - Zapytanie: "Znajdź projekty"
  - Oczekiwany wynik: Pytanie o doprecyzowanie (geografia, temat, odbiorca)
- **Test Case 3.3**: Bardzo niska confidence (0.3)
  - Zapytanie: "Coś o projektach"
  - Oczekiwany wynik: Pytanie o doprecyzowanie z listą wszystkich slotów

**Scenariusz A4: Prezentacja planu przed tool calls**
- **Co sprawdzić**:
  - Wpisać: "Znajdź projekty w Monday.com"
  - Sprawdzić czy plan jest prezentowany w odpowiedzi AI PRZED uruchomieniem narzędzi
  - Sprawdzić czy plan zawiera "Mój plan:" i numerowane kroki (1), 2), 3), 4))
  - Sprawdzić czy plan zawiera informację o narzędziach
  - Sprawdzić czy plan zawiera pytanie "Czy chcesz coś zmienić w tym planie?"
  - Sprawdzić czy narzędzia są uruchamiane PO prezentacji planu

**Scenariusz A5: Plan dla różnych typów zapytań**
- **Test Case 5.1**: Zapytanie o Monday.com
  - Zapytanie: "Znajdź projekty w Monday.com"
  - Oczekiwany wynik: Plan zawiera "użyję narzędzi Monday.com MCP"
- **Test Case 5.2**: Zapytanie o Slack
  - Zapytanie: "Szukaj w Slack: 'projekt edukacyjny'"
  - Oczekiwany wynik: Plan zawiera "użyję narzędzi Slack"
- **Test Case 5.3**: Zapytanie o generowanie
  - Zapytanie: "Wygeneruj raport o projektach w Kenii"
  - Oczekiwany wynik: Plan zawiera "wygeneruję [format]"

#### Część B: Stop & Ask Triggers

**Scenariusz B1: Trigger dla >100 rekordów**
- **Co sprawdzić**:
  - Wpisać: "Pokaż wszystkie itemy z Monday.com"
  - Sprawdzić czy w odpowiedzi pojawia się warning: "Znaleziono X rekordów. Proszę zawęzić zakres zapytania..."
  - Sprawdzić czy system sugeruje dodanie filtrów
  - Sprawdzić czy narzędzia są uruchamiane (ale z warning)

**Scenariusz B2: Trigger dla niskiej confidence intent**
- **Co sprawdzić**:
  - Wpisać: "Coś o projektach"
  - Sprawdzić czy system pyta: "Nie jestem pewien co do: intencję. Czy możesz doprecyzować?"
  - Sprawdzić czy system NIE uruchamia narzędzi przed doprecyzowaniem
  - Po doprecyzowaniu: sprawdzić czy narzędzia są uruchamiane

#### Część C: Feedback Loop

**Scenariusz C1: Ocena odpowiedzi - 👍**
- **Co sprawdzić**:
  - Wyślij wiadomość: "Znajdź projekt w Kenii"
  - Poczekaj na odpowiedź AI
  - Kliknij przycisk 👍
  - Sprawdź czy przycisk zmienia stan na "submitting" (może być wizualnie wyłączony)
  - Sprawdź czy po zapisie wyświetlony jest checkmark ✅ + tekst "Dziękujemy za opinię!"
  - Sprawdź DevTools Network - powinien być POST request do `/api/feedback`
  - Sprawdź DB (jeśli skonfigurowane): `SELECT * FROM "MessageFeedback" ORDER BY "createdAt" DESC LIMIT 1;` - powinien zawierać `rating = 1`

**Scenariusz C2: Ocena odpowiedzi - 👎 z komentarzem**
- **Co sprawdzić**:
  - Wyślij wiadomość: "Znajdź projekt w Kenii"
  - Poczekaj na odpowiedź AI
  - Kliknij przycisk 👎
  - Sprawdź czy pojawia się pole komentarza (Textarea)
  - Wpisz komentarz: "Odpowiedź była nieprecyzyjna"
  - Kliknij "Wyślij"
  - Sprawdź czy feedback jest zapisany
  - Sprawdź DevTools Network - POST request powinien zawierać `comment` w body
  - Sprawdź DB: `SELECT * FROM "MessageFeedback" WHERE rating = -1 ORDER BY "createdAt" DESC LIMIT 1;` - powinien zawierać `comment`

**Scenariusz C3: Anulowanie komentarza**
- **Co sprawdzić**:
  - Kliknij 👎 przy odpowiedzi AI
  - Sprawdź czy pojawia się pole komentarza
  - Wpisz komentarz: "Test comment"
  - Kliknij "Anuluj"
  - Sprawdź czy pole komentarza znika
  - Sprawdź czy stan pozostaje "idle" (przyciski 👍/👎 nadal widoczne)
  - Sprawdź DevTools Network - NIE powinien być POST request do `/api/feedback`
  - Sprawdź DB - nie powinien być nowy rekord

**Scenariusz C4: Feedback tylko przy ostatniej odpowiedzi**
- **Co sprawdzić**:
  - Wyślij pierwszą wiadomość: "Cześć" → odpowiedź AI
  - Wyślij drugą wiadomość: "Znajdź projekt" → odpowiedź AI
  - Sprawdź czy tylko najnowsza odpowiedź AI ma przyciski 👍/👎
  - Sprawdź czy starsze odpowiedzi NIE mają przycisków feedbacku
  - Sprawdź DevTools Elements - starsze odpowiedzi nie powinny zawierać komponentu FeedbackButtons

**Scenariusz C5: Weryfikacja zapisu kontekstu**
- **Co sprawdzić**:
  - Wyślij wiadomość: "Znajdź projekt w Kenii"
  - Poczekaj na odpowiedź (która używa narzędzi Monday.com)
  - Kliknij 👍
  - Sprawdź DB:
    ```sql
    SELECT 
      "userQuery", 
      "assistantResponse", 
      "toolsUsed", 
      "rating",
      "chatId",
      "messageId",
      "userId",
      "createdAt"
    FROM "MessageFeedback" 
    ORDER BY "createdAt" DESC 
    LIMIT 1;
    ```
  - Sprawdź czy wszystkie pola są zapisane:
    - `userQuery` = "Znajdź projekt w Kenii"
    - `assistantResponse` = treść odpowiedzi AI (pełna odpowiedź)
    - `toolsUsed` = `["get_board_items", "get_item_details"]` (lub podobne - JSON array)
    - `rating` = 1
    - `chatId` = ID chatu
    - `messageId` = ID wiadomości AI
    - `userId` = ID użytkownika
    - `createdAt` = timestamp

#### Część D: Scenariusze Integracyjne

**Scenariusz D1: Pełny flow - od zapytania do feedbacku**
- **Co sprawdzić**:
  - Wpisać: "Znajdź projekty edukacyjne w Kenii dla donora"
  - Sprawdzić czy plan jest prezentowany przed uruchomieniem narzędzi
  - Sprawdzić czy narzędzia są uruchamiane (Monday.com MCP)
  - Sprawdzić czy odpowiedź jest generowana z wynikami z narzędzi
  - Sprawdzić czy feedback można ocenić (przyciski 👍/👎 widoczne)
  - Kliknąć 👍 lub 👎
  - Sprawdzić DB czy feedback zapisany z pełnym kontekstem

**Scenariusz D2: Flow z doprecyzowaniem**
- **Co sprawdzić**:
  - Wpisać: "Coś o projektach"
  - Sprawdzić czy system pyta o doprecyzowanie przy pierwszym zapytaniu
  - Odpowiedzieć: "Znajdź projekty edukacyjne w Kenii"
  - Sprawdzić czy plan jest generowany po doprecyzowaniu
  - Sprawdzić czy narzędzia są uruchamiane po prezentacji planu
  - Sprawdzić czy feedback można ocenić po otrzymaniu odpowiedzi
  - Sprawdzić DB - feedback powinien zawierać `userQuery` z doprecyzowanym zapytaniem

---

## Jak weryfikować logi serwera

Podczas testów manualnych sprawdź logi konsoli serwera (`pnpm dev`):

1. **Intent Extraction**:
   - Powinno być logowanie wywołania `extractIntent()`
   - Powinno być logowanie `queryContext` z confidence scores

2. **Plan Generation**:
   - Powinno być logowanie wywołania `generatePlan()`
   - Powinno być logowanie wygenerowanego planu

3. **Stop & Ask Triggers**:
   - Powinno być logowanie `recordCount` gdy >100 rekordów
   - Powinno być logowanie `_warning` w odpowiedzi MCP

4. **Feedback**:
   - Powinno być logowanie zapisu feedbacku w `saveFeedback()`
   - Powinno być logowanie błędów jeśli DB nie jest skonfigurowane (graceful degradation)

---

## Checklist do wypełnienia przez testera

### Część A: Intent + Confidence
- [ ] **Scenariusz A1:** Jasne zapytanie → brak pytań, plan generowany
- [ ] **Scenariusz A2:** Niejasne zapytanie → pytanie o doprecyzowanie
- [ ] **Scenariusz A3:** Różne poziomy confidence → odpowiednie zachowanie
- [ ] **Scenariusz A4:** Prezentacja planu przed tool calls
- [ ] **Scenariusz A5:** Plan dla różnych typów zapytań

### Część B: Stop & Ask Triggers
- [ ] **Scenariusz B1:** Trigger >100 rekordów → warning o zawężeniu
- [ ] **Scenariusz B2:** Trigger niskiej confidence → pytanie o doprecyzowanie

### Część C: Feedback Loop
- [ ] **Scenariusz C1:** Ocena 👍 → zapis w DB
- [ ] **Scenariusz C2:** Ocena 👎 z komentarzem → zapis w DB
- [ ] **Scenariusz C3:** Anulowanie komentarza → brak zapisu
- [ ] **Scenariusz C4:** Feedback tylko przy ostatniej odpowiedzi
- [ ] **Scenariusz C5:** Weryfikacja zapisu kontekstu

### Część D: Scenariusze Integracyjne
- [ ] **Scenariusz D1:** Pełny flow → wszystko działa
- [ ] **Scenariusz D2:** Flow z doprecyzowaniem → wszystko działa

---

**Data utworzenia:** 2025-01-27  
**Ostatnia aktualizacja:** 2025-01-27


