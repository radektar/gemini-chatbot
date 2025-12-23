# Faza 03 - Monday.com Read-Only: Przewodnik Testów Manualnych

**Data:** 2025-12-19  
**Wersja:** 0.1.5  
**Branch:** `phase/03-integrations-readonly`

---

## Przygotowanie

### Wymagania

1. **Aplikacja uruchomiona:**
   ```bash
   pnpm dev
   ```

2. **Zmienne środowiskowe skonfigurowane** (`.env.local`):
   ```bash
   MONDAY_API_TOKEN=twój_token
   MONDAY_ALLOWED_BOARD_ID=5088645756  # opcjonalnie
   AUTH_SECRET=...
   ```

3. **Zalogowany użytkownik** w aplikacji

---

## Scenariusz 1: Próba utworzenia item w Monday.com

### Cel
Weryfikacja, że operacje write są blokowane z czytelnym komunikatem błędu.

### Kroki

1. Otwórz aplikację w przeglądarce: `http://localhost:3000`
2. Zaloguj się (jeśli wymagane)
3. W czacie wpisz jedno z poniższych zapytań:
   - "Utwórz nowy item w Monday.com z tytułem 'Test Item'"
   - "Dodaj item do boardu X"
   - "Zmień status itemu Y na 'Done'"
   - "Usuń item Z z Monday.com"

### Oczekiwany wynik

✅ **Asystent odmawia wykonania operacji** z komunikatem zawierającym:
- Informację o trybie read-only
- Nazwę zablokowanej operacji (np. "create_item", "delete_item")
- Wyjaśnienie, że integracja używa tylko odczytu

✅ **W logach konsoli serwera** (terminal gdzie działa `pnpm dev`):
```
[Monday.com MCP] ❌ Blocked explicit write operation: create_item
```
lub
```
[Monday.com MCP] ❌ Blocked by keyword 'create': create_new_item
```

✅ **W logach przeglądarki** (DevTools Console):
- Komunikat błędu z `ReadOnlyModeError`
- Nazwa operacji w błędzie

### Przykładowe komunikaty błędów

**Dobry komunikat:**
```
❌ Operacja zapisu 'create_item' jest ZABLOKOWANA w trybie read-only. 
Ten projekt używa dostępu tylko do odczytu, aby zapobiec przypadkowym modyfikacjom danych.
```

**Zły komunikat (jeśli występuje):**
- Ogólny błąd bez informacji o read-only
- Brak nazwy operacji w błędzie
- Crash aplikacji zamiast czytelnego komunikatu

---

## Scenariusz 2: Pobranie danych z Monday.com

### Cel
Weryfikacja, że operacje read działają poprawnie.

### Kroki

1. Otwórz aplikację w przeglądarce: `http://localhost:3000`
2. Zaloguj się (jeśli wymagane)
3. W czacie wpisz jedno z poniższych zapytań:
   - "Pokaż mi wszystkie boardy w Monday.com"
   - "Znajdź itemy w boardzie X"
   - "Pokaż mi szczegóły itemu Y"
   - "Wyszukaj w Monday.com: 'projekt edukacyjny'"

### Oczekiwany wynik

✅ **Asystent wykonuje operację read** i zwraca dane:
- Lista boardów (jeśli zapytanie o boardy)
- Lista itemów (jeśli zapytanie o itemy)
- Szczegóły itemu (jeśli zapytanie o szczegóły)
- Wyniki wyszukiwania (jeśli zapytanie o wyszukiwanie)

✅ **W logach konsoli serwera**:
```
[Monday.com MCP] ✅ Allowed explicit read operation: get_boards
```
lub
```
[Monday.com MCP] ✅ Allowed by pattern: get_board_items
```

✅ **Brak błędów** w logach przeglądarki

### Przykładowe odpowiedzi

**Dobra odpowiedź:**
```
Znalazłem 3 boardy w Monday.com:
1. Projekty Aktywne (ID: 123456)
2. Projekty Zakończone (ID: 789012)
3. Projekty Planowane (ID: 345678)
```

**Zła odpowiedź (jeśli występuje):**
- Błąd "Unauthorized" lub "Forbidden"
- Komunikat o blokadzie operacji read
- Brak danych mimo poprawnego zapytania

---

## Scenariusz 3: Weryfikacja braku debug artifacts

### Cel
Upewnienie się, że kod produkcyjny nie zawiera debug calls.

### Kroki

1. Otwórz plik `lib/monday-readonly.ts` w edytorze
2. Wyszukaj w pliku (Ctrl+F / Cmd+F):
   - `127.0.0.1:7242`
   - `fetch('http://127.0.0.1`
   - `localhost:7242`
   - `agent log`

### Oczekiwany wynik

✅ **Brak wyników wyszukiwania** - wszystkie debug calls zostały usunięte

❌ **Jeśli znajdziesz wyniki:**
- Oznacza to, że debug artifacts nie zostały usunięte
- Należy je usunąć przed wdrożeniem do produkcji

---

## Scenariusz 4: Weryfikacja logów bezpieczeństwa

### Cel
Upewnienie się, że logi nie zawierają sekretów i są czytelne.

### Kroki

1. Uruchom aplikację: `pnpm dev`
2. Wykonaj operację read (np. pobierz boardy) - **Scenariusz 2**
3. Wykonaj próbę operacji write (np. utwórz item) - **Scenariusz 1**
4. Sprawdź logi konsoli serwera (terminal)

### Oczekiwany wynik

✅ **Logi zawierają:**
- Informacje o dozwolonych operacjach read z prefiksem `✅`
- Ostrzeżenia o zablokowanych operacjach write z prefiksem `❌`
- Ostrzeżenia o nieznanych operacjach z prefiksem `⚠️`

✅ **Logi NIE zawierają:**
- Tokenów API (`MONDAY_API_TOKEN`, `sk-ant-...`, `eyJhbGciOi...`)
- Sekretów (`AUTH_SECRET`, hasła)
- Danych osobowych (pełne emaile, nazwiska)
- Hardcoded localhost calls (`127.0.0.1:7242`)

### Przykładowe logi

**Dobre logi:**
```
[Monday.com MCP] ✅ Allowed explicit read operation: get_boards
[Monday.com MCP] ❌ Blocked explicit write operation: create_item
[Monday.com MCP] ⚠️  Unknown operation 'unknown_op' - BLOCKED by default (fail-safe)
```

**Złe logi (jeśli występują):**
```
[Monday.com MCP] Token: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
[Monday.com MCP] API Key: sk-ant-api03-...
[Monday.com MCP] User email: jan.kowalski@example.com
```

---

## Scenariusz 5: Weryfikacja fail-safe dla nieznanych operacji

### Cel
Upewnienie się, że nieznane operacje są blokowane domyślnie.

### Kroki

1. Otwórz DevTools Console w przeglądarce
2. Wykonaj w konsoli:
   ```javascript
   // Symulacja nieznanej operacji (wymaga dostępu do funkcji)
   // W rzeczywistości sprawdź logi serwera gdy asystent próbuje użyć nieznanej operacji
   ```

3. Lub sprawdź logi serwera gdy:
   - Asystent próbuje użyć operacji, która nie istnieje w whitelist
   - Występuje błąd w nazwie operacji

### Oczekiwany wynik

✅ **W logach serwera:**
```
[Monday.com MCP] ⚠️  Unknown operation 'unknown_operation_xyz' - BLOCKED by default (fail-safe). 
If this is a read-only operation, add it to MONDAY_READ_ONLY_OPERATIONS.
```

✅ **Operacja jest zablokowana** (nie wykonana)

✅ **Komunikat zawiera:**
- Nazwę nieznanej operacji
- Informację o fail-safe blocking
- Instrukcję jak dodać operację do whitelist (jeśli jest read-only)

---

## Scenariusz 6: Weryfikacja GraphQL queries

### Cel
Upewnienie się, że mutacje GraphQL są blokowane.

### Kroki

1. W kodzie lub przez API wywołaj `validateGraphQLQuery()` z:
   - Query read-only (powinno przejść)
   - Mutation (powinno być zablokowane)

### Oczekiwany wynik

✅ **Read-only query:**
```graphql
query {
  boards(ids: [123456]) {
    name
  }
}
```
- Przechodzi walidację
- W logach: `[Monday.com MCP] ✅ GraphQL query is read-only safe`

✅ **Mutation:**
```graphql
mutation {
  create_item(board_id: 123456, item_name: "Test") {
    id
  }
}
```
- Jest blokowana
- Rzuca `ReadOnlyModeError` z komunikatem o mutacji

---

## Checklist Testów Manualnych

Przed wdrożeniem do produkcji:

- [ ] **Scenariusz 1:** Próba utworzenia item → odmowa z czytelnym komunikatem
- [ ] **Scenariusz 2:** Pobranie danych → działa poprawnie
- [ ] **Scenariusz 3:** Brak debug artifacts → zweryfikowane w kodzie
- [ ] **Scenariusz 4:** Logi bezpieczne → brak sekretów, czytelne komunikaty
- [ ] **Scenariusz 5:** Fail-safe działa → nieznane operacje blokowane
- [ ] **Scenariusz 6:** GraphQL validation → mutacje blokowane

---

## Raportowanie wyników

Po wykonaniu testów manualnych:

1. Zaktualizuj `docs/PH03_MONDAY_TEST_RESULTS.md` z wynikami
2. Dodaj screenshoty błędów (jeśli występują)
3. Zanotuj wszelkie problemy lub nieoczekiwane zachowania
4. Zweryfikuj czy wszystkie scenariusze przeszły pomyślnie

---

## Troubleshooting

### Problem: Asystent wykonuje operacje write mimo blokady

**Rozwiązanie:**
1. Sprawdź czy flaga `-ro` jest ustawiona w `integrations/mcp/monday.ts`
2. Sprawdź logi serwera - czy operacja jest blokowana?
3. Sprawdź czy `isReadOnlyTool()` zwraca `false` dla operacji write

### Problem: Operacje read są blokowane

**Rozwiązanie:**
1. Sprawdź czy operacja jest w `MONDAY_READ_ONLY_OPERATIONS`
2. Sprawdź logi - jaki komunikat blokady?
3. Sprawdź czy nazwa operacji jest poprawnie znormalizowana

### Problem: Logi zawierają sekrety

**Rozwiązanie:**
1. Sprawdź wszystkie `console.log()` w kodzie
2. Upewnij się, że nie logujesz zmiennych środowiskowych
3. Użyj maskowania dla wrażliwych danych

---

**Data utworzenia:** 2025-12-19  
**Ostatnia aktualizacja:** 2025-12-19


