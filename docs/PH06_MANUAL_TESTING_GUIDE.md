# PH06 Manual Testing Guide - Krok po kroku

**Data**: [DATA]  
**Tester**: [IMIĘ]  
**Branch**: `phase/06-context-budget-hardening`

---

## Przygotowanie

1. ✅ Upewnij się, że aplikacja działa: `pnpm dev`
2. ✅ Otwórz http://localhost:3000 w przeglądarce
3. ✅ Zaloguj się do aplikacji
4. ✅ Otwórz konsolę serwera (terminal gdzie działa `pnpm dev`) - tam będą logi

---

## Test A1: Limit rekordów Monday.com (domyślny)

### Konkretne zapytanie do użycia:
```
Pokaż wszystkie projekty z Kenii ze statusem "W trakcie"
```

**Alternatywnie (jeśli powyższe nie działa):**
```
Znajdź wszystkie projekty edukacyjne w Ugandzie
```

### Kroki:
1. Wyślij zapytanie powyżej w UI
2. Sprawdź odpowiedź AI - powinno być maksymalnie 30 rekordów
3. Sprawdź logi konsoli serwera - szukaj:
   ```
   [Monday.com Payload] Tool: get_board_items_page, Original: X items, Processed: 30 items, ~Y tokens
   ```

### Co sprawdzić:
- [ ] Odpowiedź zawiera maksymalnie 30 rekordów
- [ ] W logach widoczne: `Processed: 30 items` (lub mniej jeśli było mniej rekordów)
- [ ] Brak dumpowania wszystkich rekordów w odpowiedzi

### Jeśli nie działa:
- Sprawdź czy zapytanie przeszło przez confidence threshold (nie było pytania o doprecyzowanie)
- Sprawdź logi czy Monday.com MCP tool został wywołany
- Sprawdź czy board ma wystarczająco dużo rekordów (>30)

---

## Test A2: Trigger "zawęź zakres" (>100 rekordów)

### Konkretne zapytanie do użycia:
```
Pokaż wszystkie projekty ze statusem aktywnym
```

**Alternatywnie:**
```
Pokaż wszystkie zadania z boardu
```

### Kroki:
1. Wyślij zapytanie powyżej w UI
2. Sprawdź odpowiedź AI - powinno być ostrzeżenie na początku
3. Sprawdź logi konsoli serwera

### Co sprawdzić:
- [ ] System wyświetla ostrzeżenie na początku odpowiedzi
- [ ] Komunikat zawiera dokładną liczbę znalezionych rekordów (np. "Znaleziono 150 rekordów")
- [ ] System prosi o zawężenie zakresu
- [ ] System NIE wyświetla listy rekordów (tylko ostrzeżenie)
- [ ] W logach widoczne: `_warning`, `_total_count`, `_displayed_count`

### Jeśli nie działa:
- Sprawdź czy board ma >100 items
- Sprawdź logi czy `shouldNarrow` jest true
- Sprawdź czy `_warning` jest w odpowiedzi

---

## Test B1: Limit wiadomości Slack (domyślny)

### Konkretne zapytanie do użycia:
```
Pokaż wiadomości z kanału #general
```

**Alternatywnie:**
```
Znajdź wiadomości o projekcie X w Slack
```

### Kroki:
1. Wyślij zapytanie powyżej w UI
2. Sprawdź odpowiedź AI - powinno być maksymalnie 15 wiadomości
3. Sprawdź logi konsoli serwera - szukaj:
   ```
   [Slack Payload] Channel: C123456, Original: X messages, Processed: 15 messages, ~Y tokens
   ```

### Co sprawdzić:
- [ ] Odpowiedź zawiera maksymalnie 15 wiadomości
- [ ] W logach widoczne: `Processed: 15 messages` (lub mniej jeśli było mniej wiadomości)
- [ ] Brak dumpowania wszystkich wiadomości

---

## Test B2: Trigger "zawęź zakres" Slack (>50 wyników)

### Konkretne zapytanie do użycia:
```
Znajdź wszystkie wiadomości o projekcie w Slack
```

**Alternatywnie:**
```
Pokaż historię kanału #general z ostatniego miesiąca
```

### Kroki:
1. Wyślij zapytanie powyżej w UI
2. Sprawdź odpowiedź AI
3. Sprawdź logi konsoli serwera - szukaj:
   ```
   [Slack Payload] Found X messages, consider narrowing search scope
   ```

### Co sprawdzić:
- [ ] System loguje ostrzeżenie w konsoli serwera
- [ ] System zwraca maksymalnie 15-25 wiadomości (zgodnie z limitem)
- [ ] System sugeruje zawężenie zakresu wyszukiwania

---

## Test C1: Kompresja historii rozmowy

### Kroki:
1. Rozpocznij długą konwersację:
   - Wyślij 15+ wiadomości (możesz użyć prostych zapytań jak "Pogoda w Warszawie", "Co to jest X?")
   - Każda wiadomość powinna mieć odpowiedź od AI
2. Po 15+ wiadomościach, wyślij kolejną wiadomość
3. Sprawdź logi konsoli serwera - szukaj:
   ```
   [Context Budget] Compressed history: X → Y messages
   ```

### Co sprawdzić:
- [ ] W logach widoczne: `Compressed history: X → Y messages` (gdzie Y < X)
- [ ] System zachowuje pierwsze 2 wiadomości (kontekst początkowy)
- [ ] System zachowuje ostatnie 10 wiadomości (sliding window)
- [ ] Odpowiedź AI jest spójna mimo kompresji

---

## Test C2: Logowanie budżetu tokenów

### Kroki:
1. Wyślij dowolne zapytanie (np. "Pogoda w Warszawie")
2. Sprawdź logi konsoli serwera - szukaj:
   ```
   [Context Budget] Usage: X/Y tokens (Z%), Degradation: LEVEL
   ```

### Co sprawdzić:
- [ ] W logach widoczne: `[Context Budget] Usage: X/Y tokens (Z%), Degradation: LEVEL`
- [ ] Usage jest obliczone poprawnie (większe od 0)
- [ ] Degradation level jest pokazany (NONE, REDUCE_RECORDS, COMPRESS_HISTORY, etc.)
- [ ] Procent użycia jest rozsądny (< 100%)

---

## Test C3: Degradacja przy wysokim użyciu

### Kroki:
1. Wyślij zapytanie wymagające dużego payloadu:
   - Długa historia rozmowy (15+ wiadomości) + zapytanie o wiele rekordów z Monday
   - Lub: zapytanie o wiele rekordów z Monday + długi system prompt
2. Sprawdź odpowiedź i logi

### Co sprawdzić:
- [ ] System wykrywa wysokie użycie budżetu (>75%)
- [ ] System stosuje odpowiednią strategię degradacji (COMPRESS_HISTORY, AGGREGATE, ASK_USER)
- [ ] W system prompt dodane jest ostrzeżenie (jeśli usage >90%)
- [ ] Odpowiedź jest nadal użyteczna mimo degradacji

---

## Test D1: Payload control + Stop & Ask trigger

### Konkretne zapytanie do użycia:
```
Pokaż wszystkie projekty ze statusem aktywnym
```

### Kroki:
1. Wyślij zapytanie powyżej (zwracające >100 rekordów)
2. Sprawdź odpowiedź AI

### Co sprawdzić:
- [ ] System wyświetla ostrzeżenie z `_warning` (z payload control)
- [ ] System NIE wyświetla rekordów (zgodnie z stop & ask trigger)
- [ ] Komunikat zawiera dokładną liczbę rekordów (`_total_count`)
- [ ] Komunikat sugeruje zawężenie zakresu

---

## Test D2: Payload control + Evidence Policy

### Konkretne zapytanie do użycia:
```
Pokaż projekty z Kenii
```

### Kroki:
1. Wyślij zapytanie powyżej
2. Sprawdź format odpowiedzi

### Co sprawdzić:
- [ ] Odpowiedź zawiera sekcję "Źródła" z linkami do Monday items
- [ ] Liczba rekordów jest ograniczona do 30 (payload control)
- [ ] Każda liczba/metryka ma źródło (Evidence Policy)
- [ ] Format odpowiedzi jest spójny (Wyniki/Źródła/Do potwierdzenia)

---

## Test D3: Payload control + Plan-first

### Konkretne zapytanie do użycia:
```
Znajdź projekty edukacyjne w Kenii
```

### Kroki:
1. Wyślij zapytanie powyżej
2. System powinien wygenerować plan
3. Potwierdź plan (np. "ok", "wykonaj")
4. Sprawdź odpowiedź

### Co sprawdzić:
- [ ] Plan jest wygenerowany przed wykonaniem
- [ ] Po potwierdzeniu system wykonuje plan
- [ ] Wyniki są ograniczone do 30 rekordów (payload control)
- [ ] System loguje payload info po wykonaniu

---

## Test E3: Bardzo długi tekst w wiadomościach

### Kroki:
1. Wyślij zapytanie zwracające wiadomości Slack z bardzo długim tekstem
2. Sprawdź odpowiedź i logi

### Co sprawdzić:
- [ ] System zwraca maksymalnie 15 wiadomości (limit)
- [ ] Token estimate jest większe (dłuższe wiadomości = więcej tokenów)
- [ ] System działa stabilnie mimo dużego payloadu

---

## Test F1: Czas odpowiedzi z payload control

### Kroki:
1. Zmierz czas odpowiedzi dla zapytania bez payload control (stary kod) - jeśli masz dostęp
2. Zmierz czas odpowiedzi dla zapytania z payload control (nowy kod)
3. Porównaj

### Co sprawdzić:
- [ ] Czas odpowiedzi jest podobny lub lepszy (mniej danych = szybsza odpowiedź)
- [ ] Brak znaczącego spadku wydajności

---

## Szablon do wypełnienia wyników

Dla każdego testu wypełnij:

```
### Test [NAZWA]
- [ ] **Status**: ✅ Przeszedł / ❌ Nie przeszedł / ⚠️ Częściowo
- [ ] **Kroki wykonane**: [Opisz co zrobiłeś]
- [ ] **Wynik**: [Opisz co się stało]
- [ ] **Logi**: [Skopiuj relevantne logi z konsoli serwera]
- [ ] **Uwagi**: [Dodatkowe uwagi, problemy, sugestie]
```

---

## Troubleshooting

### Problem: Nie widzę logów w konsoli
**Rozwiązanie**: Upewnij się, że patrzysz na konsolę serwera (terminal gdzie działa `pnpm dev`), nie konsolę przeglądarki.

### Problem: Zapytanie jest zbyt ogólne
**Rozwiązanie**: Użyj bardziej konkretnych zapytań z filtrami (geografia, status, temat).

### Problem: Board nie ma wystarczająco dużo rekordów
**Rozwiązanie**: Sprawdź czy board ma >30 items dla testu A1, >100 items dla testu A2.

### Problem: Slack nie zwraca wystarczająco dużo wiadomości
**Rozwiązanie**: Sprawdź czy kanał ma >15 wiadomości dla testu B1, >50 dla testu B2.

---

## Gotowe do rozpoczęcia!

Zacznij od Testu A1 i przechodź kolejno przez wszystkie testy. Po każdym teście wypełnij wyniki w `docs/PH06_MANUAL_TEST_RESULTS.md`.

