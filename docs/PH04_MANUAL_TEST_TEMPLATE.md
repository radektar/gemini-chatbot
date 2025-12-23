# Faza 04 - Szablon Wyników Testów Manualnych

**Data:** 2025-01-27  
**Wersja:** [0.2.0]  
**Branch:** `phase/04-plan-first`  
**Tester:** [Wpisz swoje imię]

---

## Instrukcje

1. Otwórz aplikację w przeglądarce: `http://localhost:3000`
2. Zaloguj się (jeśli wymagane)
3. Wykonaj każdy scenariusz zgodnie z `docs/PH04_MANUAL_TEST_GUIDE.md`
4. Wypełnij poniższy szablon wynikami
5. Skopiuj wyniki do `docs/PH04_MANUAL_TEST_RESULTS.md`

---

## Wyniki scenariuszy

### Część A: Intent Extraction + Confidence-based Prompting

#### Scenariusz A1: Jasne zapytanie - wszystkie sloty z wysoką confidence
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Znajdź projekt edukacyjny w Kenii dla donora"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz A2: Niejasne zapytanie - niska confidence
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Coś o projektach"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz A3: Różne poziomy confidence
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Test Case 3.1** (wysoka confidence): 
  - Zapytanie: "Znajdź projekty edukacyjne w Kenii dla donora w formie narracji"
  - Wynik: 
- **Test Case 3.2** (średnia confidence):
  - Zapytanie: "Znajdź projekty"
  - Wynik: 
- **Test Case 3.3** (bardzo niska confidence):
  - Zapytanie: "Coś o projektach"
  - Wynik: 
- **Uwagi**: 

#### Scenariusz A4: Prezentacja planu przed tool calls
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Znajdź projekty w Monday.com"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz A5: Plan dla różnych typów zapytań
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Test Case 5.1** (Monday.com):
  - Zapytanie: "Znajdź projekty w Monday.com"
  - Wynik: 
- **Test Case 5.2** (Slack):
  - Zapytanie: "Szukaj w Slack: 'projekt edukacyjny'"
  - Wynik: 
- **Test Case 5.3** (generowanie):
  - Zapytanie: "Wygeneruj raport o projektach w Kenii"
  - Wynik: 
- **Uwagi**: 

---

### Część B: Stop & Ask Triggers

#### Scenariusz B1: Trigger dla >100 rekordów
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Pokaż wszystkie itemy z Monday.com"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz B2: Trigger dla niskiej confidence intent
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Coś o projektach"
- **Wynik**: 
- **Uwagi**: 

---

### Część C: Feedback Loop

#### Scenariusz C1: Ocena odpowiedzi - 👍
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Znajdź projekt w Kenii"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz C2: Ocena odpowiedzi - 👎 z komentarzem
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Znajdź projekt w Kenii"
- **Komentarz**: "Odpowiedź była nieprecyzyjna"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz C3: Anulowanie komentarza
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz C4: Feedback tylko przy ostatniej odpowiedzi
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie 1**: "Cześć"
- **Zapytanie 2**: "Znajdź projekt"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz C5: Weryfikacja zapisu kontekstu
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Znajdź projekt w Kenii"
- **Wynik DB**: 
- **Uwagi**: 

---

### Część D: Scenariusze Integracyjne

#### Scenariusz D1: Pełny flow - od zapytania do feedbacku
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie**: "Znajdź projekty edukacyjne w Kenii dla donora"
- **Wynik**: 
- **Uwagi**: 

#### Scenariusz D2: Flow z doprecyzowaniem
- **Status**: ⏸️ Do wykonania
- **Data testu**: 
- **Tester**: 
- **Zapytanie 1**: "Coś o projektach"
- **Zapytanie 2**: "Znajdź projekty edukacyjne w Kenii"
- **Wynik**: 
- **Uwagi**: 

---

## Znalezione problemy

### Problem 1: [Tytuł problemu]
- **Scenariusz**: [ID scenariusza]
- **Opis**: 
- **Priorytet**: Wysoki / Średni / Niski
- **Status**: Otwarty / Naprawiony / Odrzucony
- **Rozwiązanie**: 

---

## Checklist końcowy

- [ ] Wszystkie scenariusze przetestowane
- [ ] Wszystkie problemy udokumentowane
- [ ] Screenshoty dodane (jeśli dotyczy)
- [ ] Rekomendacje sformułowane
- [ ] Wyniki skopiowane do `docs/PH04_MANUAL_TEST_RESULTS.md`

---

**Data utworzenia:** 2025-01-27  
**Ostatnia aktualizacja:** 2025-01-27


