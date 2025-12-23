# Faza 04 - Plan-first + Feedback Loop: Przewodnik Testów Manualnych

**Data:** 2025-01-XX  
**Wersja:** [0.2.0]  
**Branch:** `phase/04-plan-first`

---

## Przygotowanie

### Wymagania

1. **Aplikacja uruchomiona:**
   ```bash
   pnpm dev
   ```

2. **Zmienne środowiskowe skonfigurowane** (`.env.local`):
   ```bash
   ANTHROPIC_API_KEY=sk-ant-...
   MONDAY_API_TOKEN=twój_token
   MONDAY_ALLOWED_BOARD_ID=5088645756  # opcjonalnie
   AUTH_SECRET=...
   POSTGRES_URL=...  # opcjonalnie (dla feedback DB)
   CONFIDENCE_THRESHOLD=0.7  # opcjonalnie (domyślnie 0.7)
   ```

3. **Zalogowany użytkownik** w aplikacji

4. **Baza danych** (opcjonalnie - graceful degradation działa bez DB)

---

## Część A: Intent Extraction + Confidence-based Prompting

### Scenariusz A1: Jasne zapytanie - wszystkie sloty z wysoką confidence

**Cel**: Weryfikacja poprawnej ekstrakcji z jasnego zapytania bez pytań o doprecyzowanie

**Kroki**:

1. Otwórz aplikację w przeglądarce: `http://localhost:3000`
2. Zaloguj się (jeśli wymagane)
3. W czacie wpisz: **"Znajdź projekt edukacyjny w Kenii dla donora"**

**Oczekiwany wynik**:

✅ **System nie pyta o doprecyzowanie** - confidence jest wystarczająco wysoka  
✅ **Plan jest generowany i prezentowany** w odpowiedzi AI  
✅ **Plan zawiera**:
   - Informację o użyciu narzędzi Monday.com MCP
   - Informację o filtrach (geografia: Kenia, temat: edukacja)
   - Informację o odbiorcy (donor)
   - Pytanie "Czy chcesz coś zmienić w tym planie?"

✅ **Po kontynuacji rozmowy** → narzędzia są uruchamiane (Monday.com MCP)

**Jak zweryfikować**:
- Sprawdź odpowiedź AI - powinna zawierać sekcję "Mój plan:"
- Sprawdź logi konsoli serwera - nie powinno być pytań o doprecyzowanie
- Sprawdź czy narzędzia Monday.com są uruchamiane po prezentacji planu

---

### Scenariusz A2: Niejasne zapytanie - niska confidence

**Cel**: Weryfikacja pytania o doprecyzowanie przy niejasnym zapytaniu

**Kroki**:

1. Otwórz aplikację
2. Zaloguj się
3. W czacie wpisz: **"Coś o projektach"**

**Oczekiwany wynik**:

✅ **System pyta o doprecyzowanie**: "Nie jestem pewien co do: intencję, źródło danych. Czy możesz doprecyzować?"  
✅ **Plan NIE jest generowany** przed doprecyzowaniem  
✅ **Po doprecyzowaniu** (np. "Znajdź projekty edukacyjne w Kenii") → plan jest generowany

**Jak zweryfikować**:
- Sprawdź odpowiedź AI - powinna zawierać pytanie o doprecyzowanie
- Sprawdź logi konsoli serwera - powinno być logowanie niskiej confidence
- Po doprecyzowaniu sprawdź czy plan jest generowany

---

### Scenariusz A3: Różne poziomy confidence

**Cel**: Weryfikacja działania threshold dla różnych poziomów confidence

**Test Cases**:

#### Test Case 3.1: Wysoka confidence (0.9)
**Zapytanie**: "Znajdź projekty edukacyjne w Kenii dla donora w formie narracji"  
**Oczekiwany wynik**: Brak pytań, plan generowany

#### Test Case 3.2: Średnia confidence (0.6)
**Zapytanie**: "Znajdź projekty"  
**Oczekiwany wynik**: Pytanie o doprecyzowanie (geografia, temat, odbiorca)

#### Test Case 3.3: Bardzo niska confidence (0.3)
**Zapytanie**: "Coś o projektach"  
**Oczekiwany wynik**: Pytanie o doprecyzowanie z listą wszystkich slotów

**Kroki**:

1. Wpisz zapytanie z wysoką confidence (Test Case 3.1)
2. Sprawdź czy system nie pyta
3. Wpisz zapytanie z niską confidence (Test Case 3.2 lub 3.3)
4. Sprawdź czy system pyta o doprecyzowanie

---

### Scenariusz A4: Prezentacja planu przed tool calls

**Cel**: Weryfikacja prezentacji planu przed wykonaniem narzędzi

**Kroki**:

1. Wpisz jasne zapytanie wymagające użycia narzędzi: **"Znajdź projekty w Monday.com"**
2. Sprawdź odpowiedź AI

**Oczekiwany wynik**:

✅ **Plan jest prezentowany w odpowiedzi AI** przed uruchomieniem narzędzi  
✅ **Plan zawiera**:
   - "Mój plan:"
   - Numerowane kroki (1), 2), 3), 4))
   - Informację o narzędziach (np. "użyję narzędzi Monday.com MCP")
   - Informację o filtrach (jeśli dotyczy)
   - Pytanie "Czy chcesz coś zmienić w tym planie?"

✅ **Po kontynuacji rozmowy** (kolejna wiadomość lub Enter) → narzędzia są uruchamiane

**Jak zweryfikować**:
- Sprawdź odpowiedź AI - plan powinien być widoczny przed wynikami z narzędzi
- Sprawdź logi konsoli serwera - narzędzia powinny być uruchamiane po prezentacji planu
- Sprawdź DevTools Network - requesty do Monday.com powinny być po prezentacji planu

---

### Scenariusz A5: Plan dla różnych typów zapytań

**Cel**: Weryfikacja generowania planu dla różnych typów zapytań

**Test Cases**:

#### Test Case 5.1: Zapytanie o Monday.com
**Zapytanie**: "Znajdź projekty w Monday.com"  
**Oczekiwany wynik**: Plan zawiera "użyję narzędzi Monday.com MCP"

#### Test Case 5.2: Zapytanie o Slack
**Zapytanie**: "Szukaj w Slack: 'projekt edukacyjny'"  
**Oczekiwany wynik**: Plan zawiera "użyję narzędzi Slack"

#### Test Case 5.3: Zapytanie o generowanie
**Zapytanie**: "Wygeneruj raport o projektach w Kenii"  
**Oczekiwany wynik**: Plan zawiera "wygeneruję [format]" (np. "wygeneruję raport w formie narracji")

**Kroki**:

1. Wpisz każde z powyższych zapytań
2. Sprawdź czy plan zawiera odpowiednie informacje o narzędziach/formacie

---

## Część B: Stop & Ask Triggers

### Scenariusz B1: Trigger dla >100 rekordów

**Cel**: Weryfikacja pytania o zawężenie przy zbyt dużej liczbie rekordów

**Kroki**:

1. Wpisz zapytanie, które zwróci >100 rekordów: **"Pokaż wszystkie itemy z Monday.com"**
2. Sprawdź odpowiedź AI

**Oczekiwany wynik**:

✅ **W odpowiedzi pojawia się warning**: "Znaleziono X rekordów. Proszę zawęzić zakres zapytania (np. przez dodanie filtrów geografii, statusu lub okresu czasowego)."  
✅ **System sugeruje** dodanie filtrów (geografia, status, okres czasowy)  
✅ **Narzędzia są uruchamiane**, ale wynik zawiera warning

**Jak zweryfikować**:
- Sprawdź odpowiedź AI - powinna zawierać warning o dużej liczbie rekordów
- Sprawdź logi konsoli serwera - powinno być logowanie `_warning` w odpowiedzi MCP
- Sprawdź DevTools Console - odpowiedź powinna zawierać pole `_warning`

**Uwaga**: Jeśli board w Monday.com ma <100 itemów, użyj innego zapytania lub zmockuj odpowiedź w kodzie.

---

### Scenariusz B2: Trigger dla niskiej confidence intent

**Cel**: Weryfikacja pytania o intencję przy niskiej confidence

**Kroki**:

1. Wpisz niejednoznaczne zapytanie: **"Coś o projektach"**
2. Sprawdź odpowiedź AI

**Oczekiwany wynik**:

✅ **System pyta**: "Nie jestem pewien co do: intencję. Czy możesz doprecyzować?"  
✅ **System nie uruchamia narzędzi** przed doprecyzowaniem  
✅ **Po doprecyzowaniu** → narzędzia są uruchamiane

**Jak zweryfikować**:
- Sprawdź odpowiedź AI - powinna zawierać pytanie o doprecyzowanie
- Sprawdź logi konsoli serwera - nie powinno być wywołań narzędzi przed doprecyzowaniem
- Sprawdź DevTools Network - brak requestów do Monday.com/Slack przed doprecyzowaniem

---

## Część C: Feedback Loop

### Scenariusz C1: Ocena odpowiedzi - 👍

**Cel**: Weryfikacja zapisu pozytywnej oceny

**Kroki**:

1. Wyślij wiadomość do AI: **"Znajdź projekt w Kenii"**
2. Poczekaj na odpowiedź AI
3. Kliknij przycisk **👍** przy odpowiedzi AI

**Oczekiwany wynik**:

✅ **Przycisk zmienia stan** na "submitting" (może być wizualnie wyłączony)  
✅ **Po zapisie** → wyświetlony checkmark ✅ + tekst "Dziękujemy za opinię!"  
✅ **Feedback zapisany w DB** z `rating = 1`

**Jak zweryfikować**:
- Sprawdź UI - przycisk powinien zmienić stan po kliknięciu
- Sprawdź DevTools Network - powinien być POST request do `/api/feedback`
- Sprawdź DB (jeśli skonfigurowane):
  ```sql
  SELECT * FROM "MessageFeedback" ORDER BY "createdAt" DESC LIMIT 1;
  ```
  Powinien zawierać `rating = 1`

---

### Scenariusz C2: Ocena odpowiedzi - 👎 z komentarzem

**Cel**: Weryfikacja zapisu negatywnej oceny z komentarzem

**Kroki**:

1. Wyślij wiadomość do AI: **"Znajdź projekt w Kenii"**
2. Poczekaj na odpowiedź AI
3. Kliknij przycisk **👎**
4. **Pojawi się pole komentarza** - wpisz: **"Odpowiedź była nieprecyzyjna"**
5. Kliknij **"Wyślij"**

**Oczekiwany wynik**:

✅ **Po kliknięciu 👎** → pojawia się pole komentarza (Textarea)  
✅ **Po wpisaniu komentarza i kliknięciu "Wyślij"** → feedback zapisany  
✅ **Feedback zapisany w DB** z `rating = -1` i `comment = "Odpowiedź była nieprecyzyjna"`

**Jak zweryfikować**:
- Sprawdź UI - pole komentarza powinno pojawić się po kliknięciu 👎
- Sprawdź DevTools Network - POST request powinien zawierać `comment` w body
- Sprawdź DB:
  ```sql
  SELECT * FROM "MessageFeedback" WHERE rating = -1 ORDER BY "createdAt" DESC LIMIT 1;
  ```
  Powinien zawierać `comment`

---

### Scenariusz C3: Anulowanie komentarza

**Cel**: Weryfikacja anulowania komentarza

**Kroki**:

1. Kliknij **👎** przy odpowiedzi AI
2. **Pojawi się pole komentarza** - wpisz komentarz: **"Test comment"**
3. Kliknij **"Anuluj"**

**Oczekiwany wynik**:

✅ **Pole komentarza znika**  
✅ **Stan pozostaje "idle"** (przyciski 👍/👎 nadal widoczne)  
✅ **Feedback nie jest zapisywany**

**Jak zweryfikować**:
- Sprawdź UI - pole komentarza powinno zniknąć
- Sprawdź DevTools Network - NIE powinien być POST request do `/api/feedback`
- Sprawdź DB - nie powinien być nowy rekord

---

### Scenariusz C4: Feedback tylko przy ostatniej odpowiedzi

**Cel**: Weryfikacja wyświetlania przycisków tylko przy ostatniej odpowiedzi

**Kroki**:

1. Wyślij pierwszą wiadomość: **"Cześć"** → odpowiedź AI
2. Wyślij drugą wiadomość: **"Znajdź projekt"** → odpowiedź AI
3. Sprawdź przyciski feedbacku przy obu odpowiedziach

**Oczekiwany wynik**:

✅ **Tylko najnowsza odpowiedź AI** ma przyciski 👍/👎  
✅ **Starsze odpowiedzi** nie mają przycisków feedbacku

**Jak zweryfikować**:
- Sprawdź UI - tylko ostatnia odpowiedź powinna mieć FeedbackButtons
- Sprawdź DevTools Elements - starsze odpowiedzi nie powinny zawierać komponentu FeedbackButtons

**Uwaga**: Implementacja może wymagać modyfikacji - sprawdź czy `components/custom/chat.tsx` przekazuje odpowiednie props do Message.

---

### Scenariusz C5: Weryfikacja zapisu kontekstu

**Cel**: Weryfikacja zapisu pełnego kontekstu feedbacku

**Kroki**:

1. Wyślij wiadomość: **"Znajdź projekt w Kenii"**
2. Poczekaj na odpowiedź (która używa narzędzi Monday.com)
3. Kliknij **👍**
4. Sprawdź DB

**Oczekiwany wynik**:

✅ **W DB zapisane**:
   - `userQuery` = "Znajdź projekt w Kenii"
   - `assistantResponse` = treść odpowiedzi AI (pełna odpowiedź)
   - `toolsUsed` = `["get_board_items", "get_item_details"]` (lub podobne - JSON array)
   - `rating` = 1
   - `chatId` = ID chatu
   - `messageId` = ID wiadomości AI
   - `userId` = ID użytkownika
   - `createdAt` = timestamp

**Jak zweryfikować**:

1. Sprawdź DB:
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

2. Sprawdź DevTools Network - POST request powinien zawierać wszystkie pola w body

3. Sprawdź logi konsoli serwera - powinno być logowanie zapisu feedbacku

---

## Część D: Scenariusze Integracyjne

### Scenariusz D1: Pełny flow - od zapytania do feedbacku

**Cel**: Weryfikacja pełnego flow z intent extraction, plan generation i feedback

**Kroki**:

1. Wpisz jasne zapytanie: **"Znajdź projekty edukacyjne w Kenii dla donora"**
2. Sprawdź czy system pokazuje plan
3. Poczekaj na odpowiedź (która używa narzędzi Monday.com)
4. Oceń odpowiedź **👍** lub **👎**
5. Sprawdź DB czy feedback zapisany z pełnym kontekstem

**Oczekiwany wynik**:

✅ **Plan jest prezentowany** przed uruchomieniem narzędzi  
✅ **Narzędzia są uruchamiane** (Monday.com MCP)  
✅ **Odpowiedź jest generowana** z wynikami z narzędzi  
✅ **Feedback można ocenić** (przyciski 👍/👎 widoczne)  
✅ **Feedback zapisany z pełnym kontekstem**:
   - `userQuery` = "Znajdź projekty edukacyjne w Kenii dla donora"
   - `assistantResponse` = pełna odpowiedź AI
   - `toolsUsed` = lista użytych narzędzi
   - `rating` = 1 lub -1

**Jak zweryfikować**:
- Sprawdź cały flow w UI - od zapytania do feedbacku
- Sprawdź logi konsoli serwera - wszystkie kroki powinny być logowane
- Sprawdź DB - feedback powinien zawierać pełny kontekst

---

### Scenariusz D2: Flow z doprecyzowaniem

**Cel**: Weryfikacja flow z pytaniem o doprecyzowanie

**Kroki**:

1. Wpisz niejasne zapytanie: **"Coś o projektach"**
2. System pyta o doprecyzowanie
3. Odpowiedz: **"Znajdź projekty edukacyjne w Kenii"**
4. Sprawdź czy plan jest generowany
5. Poczekaj na odpowiedź
6. Oceń odpowiedź

**Oczekiwany wynik**:

✅ **System pyta o doprecyzowanie** przy pierwszym zapytaniu  
✅ **Po doprecyzowaniu** → plan jest generowany  
✅ **Narzędzia są uruchamiane** po prezentacji planu  
✅ **Feedback można ocenić** po otrzymaniu odpowiedzi

**Jak zweryfikować**:
- Sprawdź UI - powinno być pytanie o doprecyzowanie, potem plan, potem odpowiedź
- Sprawdź logi konsoli serwera - powinno być logowanie niskiej confidence, potem generowania planu
- Sprawdź DB - feedback powinien zawierać `userQuery` z doprecyzowanym zapytaniem

---

## Checklist Testów Manualnych

Przed wdrożeniem do produkcji:

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

## Raportowanie wyników

Po wykonaniu testów manualnych:

1. Zaktualizuj `docs/PH04_MANUAL_TEST_RESULTS.md` z wynikami
2. Dodaj screenshoty (jeśli występują problemy)
3. Zanotuj wszelkie problemy lub nieoczekiwane zachowania
4. Zweryfikuj czy wszystkie scenariusze przeszły pomyślnie

---

## Troubleshooting

### Problem: System nie pyta o doprecyzowanie mimo niskiej confidence

**Rozwiązanie**:
1. Sprawdź logi konsoli serwera - czy `extractIntent()` jest wywoływane?
2. Sprawdź czy `CONFIDENCE_THRESHOLD` jest ustawiony poprawnie
3. Sprawdź czy `queryContext.averageConfidence` jest obliczane poprawnie

### Problem: Plan nie jest generowany

**Rozwiązanie**:
1. Sprawdź logi konsoli serwera - czy `generatePlan()` jest wywoływane?
2. Sprawdź czy confidence jest >= threshold
3. Sprawdź czy `generatePlan()` nie rzuca błędów

### Problem: Feedback nie jest zapisywany

**Rozwiązanie**:
1. Sprawdź DevTools Network - czy POST request do `/api/feedback` jest wysyłany?
2. Sprawdź logi konsoli serwera - czy `saveFeedback()` jest wywoływane?
3. Sprawdź czy DB jest skonfigurowane (lub czy graceful degradation działa)
4. Sprawdź czy użytkownik jest zalogowany (sesja)

### Problem: Przyciski feedbacku nie są widoczne

**Rozwiązanie**:
1. Sprawdź DevTools Elements - czy komponent `FeedbackButtons` jest renderowany?
2. Sprawdź czy `role === "assistant"` w komponencie Message
3. Sprawdź czy props są przekazywane poprawnie z Chat do Message

### Problem: Warning o >100 rekordów nie pojawia się

**Rozwiązanie**:
1. Sprawdź czy odpowiedź MCP rzeczywiście zawiera >100 rekordów
2. Sprawdź logi konsoli serwera - czy `recordCount` jest obliczane poprawnie?
3. Sprawdź czy struktura odpowiedzi jest obsługiwana (items/boards/direct array)

---

**Data utworzenia:** 2025-01-XX  
**Ostatnia aktualizacja:** 2025-01-XX


