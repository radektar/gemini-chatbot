# PH06 - Konkretne zapytania do testów manualnych

## Test A1: Limit rekordów Monday.com (domyślny)

### Problem
Zapytanie "Pokaż wszystkie projekty z Monday" jest zbyt ogólne i jest blokowane przez confidence-based prompting (faza 04). Potrzebujemy konkretniejszych zapytań, które:
- Mają confidence >= 0.7 (przechodzą przez filtr)
- Zwracają >30 rekordów (żeby przetestować limit)
- Używają konkretnych filtrów (geografia, status, temat)

---

## Rekomendowane zapytania do testu A1

### Opcja 1: Z konkretną geografią i statusem (NAJLEPSZA)
```
Pokaż wszystkie projekty z Kenii ze statusem "W trakcie"
```

**Dlaczego działa:**
- ✅ Konkretna geografia: "Kenia"
- ✅ Konkretny status: "W trakcie"
- ✅ Actionable query (confidence >= 0.7)
- ✅ Zwróci wiele rekordów (jeśli board ma >30 projektów z Kenii)

---

### Opcja 2: Z geografią i tematem
```
Znajdź wszystkie projekty edukacyjne w Ugandzie
```

**Dlaczego działa:**
- ✅ Konkretna geografia: "Uganda"
- ✅ Konkretny temat: "edukacyjne"
- ✅ Actionable query (confidence >= 0.7)

---

### Opcja 3: Z okresem czasowym
```
Pokaż wszystkie projekty z ostatnich 12 miesięcy ze statusem aktywnym
```

**Dlaczego działa:**
- ✅ Konkretny okres: "ostatnie 12 miesięcy"
- ✅ Konkretny status: "aktywny"
- ✅ Actionable query (confidence >= 0.7)

---

### Opcja 4: Z konkretnym board ID (jeśli znasz)
```
Pokaż wszystkie zadania z boardu 5088645756
```

**Dlaczego działa:**
- ✅ Konkretny board ID
- ✅ Bardzo wysoka confidence (>= 0.9)
- ⚠️ Wymaga znajomości board ID

---

### Opcja 5: Z wieloma filtrami (najbardziej konkretne)
```
Znajdź wszystkie projekty edukacyjne w Kenii ze statusem "W trakcie" z ostatnich 6 miesięcy
```

**Dlaczego działa:**
- ✅ Wiele konkretnych filtrów (geografia + temat + status + okres)
- ✅ Bardzo wysoka confidence (>= 0.9)
- ✅ Zwróci wiele rekordów (jeśli spełniają kryteria)

---

## Test A2: Trigger "zawęź zakres" (>100 rekordów)

### Rekomendowane zapytania

### Opcja 1: Bardzo szerokie zapytanie
```
Pokaż wszystkie projekty ze statusem aktywnym
```

**Dlaczego działa:**
- ✅ Konkretny status (confidence >= 0.7)
- ✅ Zwróci >100 rekordów (jeśli board ma dużo aktywnych projektów)
- ✅ Trigger "zawęź zakres" powinien się uruchomić

---

### Opcja 2: Bez filtrów (jeśli board ma >100 items)
```
Pokaż wszystkie zadania z boardu
```

**Dlaczego działa:**
- ✅ Konkretny board (jeśli MONDAY_ALLOWED_BOARD_ID jest ustawione)
- ✅ Zwróci wszystkie items z boardu (>100 jeśli board jest duży)

---

## Jak sprawdzić czy zapytanie przejdzie

1. **Sprawdź logi konsoli serwera** - szukaj:
   ```
   [Intent Extraction] Confidence: X.XX
   ```
   Jeśli confidence >= 0.7, zapytanie przejdzie.

2. **Jeśli zapytanie jest zablokowane**, system zapyta:
   ```
   Nie jestem pewien co do: [coś]. Czy możesz doprecyzować?
   ```

3. **Jeśli zapytanie przejdzie**, system:
   - Wygeneruje plan
   - Wykona zapytanie do Monday.com
   - Zwróci wyniki (ograniczone do 30 rekordów)

---

## Co sprawdzić w logach (Test A1)

Po wysłaniu zapytania, sprawdź logi konsoli serwera:

1. **Intent extraction:**
   ```
   [Intent Extraction] Confidence: 0.85
   ```

2. **Payload control:**
   ```
   [Monday.com Payload] Tool: get_board_items_page, Original: 45 items, Processed: 30 items, ~450 tokens
   ```

3. **Context budget:**
   ```
   [Context Budget] Usage: 15,234/200,000 tokens (7.6%), Degradation: none
   ```

---

## Troubleshooting

### Problem: Zapytanie nadal jest zbyt ogólne
**Rozwiązanie:** Dodaj więcej konkretnych filtrów:
- ❌ "Pokaż projekty"
- ✅ "Pokaż projekty edukacyjne w Kenii ze statusem aktywnym"

### Problem: Zwraca mniej niż 30 rekordów
**Rozwiązanie:** Użyj szerszego zapytania:
- ❌ "Pokaż projekty z Kenii z dzisiaj"
- ✅ "Pokaż wszystkie projekty z Kenii"

### Problem: Nie widzę logów payload
**Rozwiązanie:** Sprawdź czy:
- Aplikacja działa (`pnpm dev`)
- Logi są w konsoli serwera (nie przeglądarki)
- Zapytanie rzeczywiście użyło Monday.com MCP tools

---

## Następne kroki

1. Wybierz jedno z zapytań powyżej
2. Wyślij je w UI (http://localhost:3000)
3. Sprawdź logi konsoli serwera
4. Zweryfikuj odpowiedź AI (max 30 rekordów)
5. Wypełnij wyniki w `docs/PH06_MANUAL_TEST_RESULTS.md`

