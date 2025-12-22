# Backlog Techniczny — Impact Chad Production

Backlog zadań technicznych podzielony na epiki odpowiadające fazom wdrożenia. Każde zadanie ma ID, priorytet, zależności, Definition of Done oraz scenariusze testowe.

## Konwencja ID zadań

- Format: `PH<NN>-<EPIC>-<XXX>`
- Przykłady: `PH01-AUTH-001`, `PH02-DB-002`, `PH03-MONDAY-001`
- Epiki: `AUTH`, `DB`, `MONDAY`, `SLACK`, `PLAN`, `EVIDENCE`, `CONTEXT`

## Priorytety

- **P0** — Blokujące (musi być przed zakończeniem fazy)
- **P1** — Wysokie (krytyczne dla funkcjonalności)
- **P2** — Średnie (ważne, ale nie blokujące)
- **P3** — Niskie (nice-to-have, może być w kolejnych iteracjach)

---

## EPIK: Faza 00 — Dokumentacja i backlog

**Branch**: `phase/00-docs-plan-backlog`  
**Status**: ✅ Ukończone

### PH00-DOCS-001: Dodanie sekcji Implementation Plan do PROJECT_SPEC.md
- **Priorytet**: P0
- **Zależności**: Brak
- **Definition of Done**:
  - Sekcja "12. Implementation Plan (Phases)" dodana do `docs/PROJECT_SPEC.md`
  - Zawiera: workflow faz, przegląd faz (tabela), szczegóły każdej fazy (00-06)
  - Link do BACKLOG.md w sekcji
- **Testy**: Review checklist — spójność z USE_CASES.md

### PH00-DOCS-002: Utworzenie BACKLOG.md
- **Priorytet**: P0
- **Zależności**: PH00-DOCS-001
- **Definition of Done**:
  - Plik `docs/BACKLOG.md` istnieje
  - Zawiera epiki dla faz 01-06 z zadaniami
  - Każde zadanie ma: ID, priorytet, zależności, DoD, testy
- **Testy**: Review checklist — kompletność zadań, brak duplikatów

---

## EPIK: Faza 01 — Auth "gating" end-to-end

**Branch**: `phase/01-auth-gating`  
**Status**: ✅ Ukończone (2025-12-19)  
**Entry criteria**: Dostępne zmienne auth (AUTH_SECRET, Google OAuth)  
**Exit criteria**: Niezalogowany → redirect/401, zalogowany → dostęp do chatu

### PH01-AUTH-001: Przywrócenie middleware autoryzacji
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Przywrócić ochronę w `middleware.ts` (obecnie jest bypass)
- **Definition of Done**:
  - `middleware.ts` używa NextAuth middleware
  - Matcher obejmuje: `/`, `/chat/*`, `/api/chat`, `/api/history`, `/api/files/upload`, `/api/slack/*`
  - Niezalogowany użytkownik jest przekierowywany do `/login`
- **Testy automatyczne**: 
  - Test smoke: middleware matcher obejmuje wymagane ścieżki
  - Test: request bez sesji → redirect/401
- **Testy manualne**:
  - Otwarcie `/` jako niezalogowany → redirect do `/login`
  - POST `/api/chat` bez cookies → 401 Unauthorized

### PH01-AUTH-002: Weryfikacja wymogu sesji w endpointach API
- **Priorytet**: P0
- **Zależności**: PH01-AUTH-001
- **Opis**: Ujednolicić wymóg sesji w kluczowych endpointach
- **Definition of Done**:
  - `/api/chat` wymaga sesji (już ma, zweryfikować)
  - `/api/history` wymaga sesji (już ma, zweryfikować)
  - `/api/files/upload` wymaga sesji (obecnie zakomentowane, przywrócić)
  - `/api/slack/sync` wymaga sesji (obecnie zakomentowane, przywrócić)
  - Wszystkie endpointy zwracają spójne błędy 401
- **Testy automatyczne**:
  - Test: każdy endpoint bez sesji → 401
  - Test: każdy endpoint z sesją → 200 (jeśli dane poprawne)
- **Testy manualne**:
  - POST `/api/chat` bez cookies → 401
  - GET `/api/history` bez cookies → 401
  - Po logowaniu: wszystkie endpointy działają

### PH01-AUTH-003: Konfiguracja Google OAuth (opcjonalnie)
- **Priorytet**: P2
- **Zależności**: PH01-AUTH-001
- **Opis**: Skonfigurować Google OAuth zgodnie z sekcją 8.2 PROJECT_SPEC.md
- **Definition of Done**:
  - Zmienne środowiskowe: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_WORKSPACE_DOMAIN` (opcjonalnie)
  - `auth.config.ts` skonfigurowany z Google Provider
  - Walidacja domeny email (jeśli `GOOGLE_WORKSPACE_DOMAIN` ustawione)
- **Testy automatyczne**: N/A (wymaga Google Cloud Console)
- **Testy manualne**:
  - Przejście do `/login` → widoczny przycisk "Sign in with Google"
  - Logowanie kontem Google → redirect do chatu
  - Logowanie kontem spoza domeny (jeśli ograniczenie włączone) → odmowa dostępu

### PH01-AUTH-004: Testy automatyczne middleware i endpointów
- **Priorytet**: P1
- **Zależności**: PH01-AUTH-001, PH01-AUTH-002
- **Opis**: Dodać testy smoke dla middleware i endpointów auth
- **Definition of Done**:
  - Plik `tests/auth-middleware.test.ts` istnieje
  - Test: middleware matcher obejmuje wymagane ścieżki
  - Test: endpointy zwracają 401 bez sesji
  - Test: endpointy zwracają 200 z sesją (mock)
- **Testy automatyczne**: `npx tsx tests/auth-middleware.test.ts` przechodzi
- **Testy manualne**: N/A

---

## EPIK: Faza 02 — Postgres/Drizzle: persistencja historii czatów

**Branch**: `phase/02-postgres-history`  
**Status**: ✅ Ukończone (2025-12-19)  
**Entry criteria**: Faza 01 zakończona (mamy user identity)  
**Exit criteria**: Historia czatu trwała po odświeżeniu, per-user isolation

### PH02-DB-001: Polityka opcjonalności Postgres (degradacja)
**Status**: ✅ Ukończone
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Ustalić i zaimplementować bezpieczną degradację gdy DB nie jest dostępna
- **Definition of Done**:
  - Jeśli `POSTGRES_URL` brak/nieprawidłowy → aplikacja działa bez DB (historia tylko w sesji)
  - `db/queries.ts` nie crashuje przy braku DB (graceful degradation)
  - Logi informują o trybie "no-DB"
- **Testy automatyczne**:
  - Test: brak POSTGRES_URL → aplikacja startuje bez błędów
  - Test: nieprawidłowy POSTGRES_URL → aplikacja startuje bez błędów
- **Testy manualne**:
  - Uruchomienie bez POSTGRES_URL → aplikacja działa, historia tylko w sesji

### PH02-DB-002: Aktywacja migracji Drizzle
**Status**: ✅ Ukończone
- **Priorytet**: P0
- **Zależności**: PH02-DB-001
- **Opis**: Upewnić się, że migracje działają poprawnie
- **Definition of Done**:
  - `db/migrate.ts` działa z walidacją placeholderów (już jest)
  - Migracje można uruchomić: `npx tsx db/migrate`
  - Schemat DB zawiera: `user`, `chat` (z `userId`, `messages`, `createdAt`)
- **Testy automatyczne**: N/A (wymaga test DB)
- **Testy manualne**:
  - Uruchomienie `npx tsx db/migrate` z prawidłowym POSTGRES_URL → migracje wykonane
  - Sprawdzenie schematu w DB → tabele `user` i `chat` istnieją

### PH02-DB-003: Weryfikacja funkcji saveChat/getChatsByUserId/getChatById
**Status**: ✅ Ukończone
- **Priorytet**: P0
- **Zależności**: PH02-DB-002
- **Opis**: Upewnić się, że funkcje z `db/queries.ts` działają w prod
- **Definition of Done**:
  - `saveChat` zapisuje chat do DB (już jest w `onFinish` callback)
  - `getChatsByUserId` zwraca tylko chaty danego użytkownika
  - `getChatById` zwraca chat tylko jeśli należy do użytkownika
  - Wszystkie funkcje mają error handling
- **Testy automatyczne**:
  - Testy dla `db/queries.ts`: mock DB lub test DB
  - Test: `saveChat` zapisuje poprawnie
  - Test: `getChatsByUserId` zwraca tylko chaty użytkownika
  - Test: `getChatById` z cudzym chatem → null/error
- **Testy manualne**:
  - Utwórz chat, wyślij 2 wiadomości → chat zapisany w DB
  - Odśwież stronę → chat jest w historii
  - Zaloguj się innym użytkownikiem → nie widzi chatów pierwszego

### PH02-DB-004: Endpoint /api/history działa z DB
**Status**: ✅ Ukończone
- **Priorytet**: P1
- **Zależności**: PH02-DB-003
- **Opis**: Upewnić się, że endpoint historii używa DB
- **Definition of Done**:
  - `/api/history` używa `getChatsByUserId` z DB
  - Zwraca tylko chaty zalogowanego użytkownika
  - Obsługuje brak DB (graceful degradation)
- **Testy automatyczne**:
  - Test: GET `/api/history` z sesją → zwraca chaty użytkownika
  - Test: GET `/api/history` bez sesji → 401
- **Testy manualne**:
  - Utwórz kilka chatów → GET `/api/history` zwraca wszystkie
  - Zaloguj się innym użytkownikiem → GET `/api/history` zwraca tylko jego chaty

---

## EPIK: Faza 03 — Integracje read-only: Monday MCP + Slack

**Branch**: `phase/03-integrations-readonly`  
**Status**: 🔄 W trakcie (PH03-MONDAY-001/002 ukończone)  
**Entry criteria**: Faza 01 zakończona (tylko zalogowani używają narzędzi)  
**Exit criteria**: Write operations blokowane, read operations działają, logi bezpieczne

### PH03-MONDAY-001: Weryfikacja 3 warstw ochrony Monday MCP
**Status**: ✅ Ukończone (2025-12-19)
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Upewnić się, że wszystkie 3 warstwy działają
- **Definition of Done**:
  - ✅ Warstwa 1: Flaga `-ro` w `integrations/mcp/monday.ts` (już jest)
  - ✅ Warstwa 2: Whitelist/blacklist w `lib/monday-readonly.ts` (ulepszone z explicit Sets)
  - ✅ Warstwa 3: Board ID filter w `integrations/mcp/init.ts` (już jest)
  - ✅ Wszystkie warstwy są aktywne i działają
- **Testy automatyczne**:
  - ✅ `npx tsx tests/monday-readonly.test.ts` przechodzi
  - ✅ `npx tsx tests/monday-readonly-enhanced.test.ts` przechodzi (nowe)
  - ⏳ `npx tsx tests/monday-mcp-security.test.ts` (do weryfikacji)
  - ⏳ `npx tsx tests/monday-mcp-e2e-security.test.ts` (wymaga tokena)
- **Testy manualne**:
  - ⏳ W UI poproś o utworzenie item w Monday → asystent odmawia i tłumaczy read-only
  - ⏳ Poproś o pobranie danych z Monday → dostajesz wynik

### PH03-MONDAY-002: Usunięcie/wyłączenie debug artifacts (localhost)
**Status**: ✅ Ukończone (2025-12-19)
- **Priorytet**: P1
- **Zależności**: Brak
- **Opis**: Usunąć lub zabezpieczyć hardcoded debug/telemetry w `lib/monday-readonly.ts`
- **Definition of Done**:
  - ✅ Usunięte wszystkie hardcoded `fetch('http://127.0.0.1:7242/...')` (3 miejsca)
  - ✅ Production-safe logging (bez sekretów w logach)
  - ✅ Logi nie zawierają tokenów, API keys, danych osobowych
- **Testy automatyczne**:
  - ✅ Test: brak hardcoded localhost calls w kodzie (weryfikacja manualna)
  - ✅ Test: logi nie zawierają sekretów (weryfikacja manualna)
- **Testy manualne**:
  - ✅ Uruchomienie aplikacji → brak błędów związanych z localhost
  - ✅ Sprawdzenie logów → brak sekretów

### PH03-MONDAY-003: Payload control dla Monday MCP (opcjonalnie)
- **Priorytet**: P2
- **Zależności**: PH03-MONDAY-001
- **Opis**: Ograniczyć rozmiar danych z Monday przed wstrzyknięciem do promptu
- **Definition of Done**:
  - Selekcja pól: tylko kluczowe kolumny, nie wszystkie
  - Paginacja/top-N: maksymalnie 20-50 rekordów na request
  - Agregacja: summary + przykłady zamiast pełnej listy
- **Testy automatyczne**:
  - Test: duży board (>100 items) → zwraca max 50 items
  - Test: selekcja pól → tylko wymagane kolumny
- **Testy manualne**:
  - Zapytanie o duży board → odpowiedź zawiera summary + przykłady, nie dump wszystkich danych

### PH03-SLACK-001: Konfiguracja Slack read-only
- **Priorytet**: P1
- **Zależności**: PH01-AUTH-002
- **Opis**: Skonfigurować Slack integration jako read-only
- **Definition of Done**:
  - Slack tools mają minimal scopes: `channels:read`, `channels:history`
  - Brak write permissions
  - Spójny log/audit dla Slack API calls
- **Testy automatyczne**:
  - Test: Slack tools nie mają write operations
  - Test: Slack API calls są logowane
- **Testy manualne**:
  - Poproś o Slack search → dostajesz wynik (jeśli integracja aktywna)
  - Poproś o wysłanie wiadomości → odmowa (jeśli próba write)

### PH03-SLACK-002: Testy automatyczne Slack security
- **Priorytet**: P2
- **Zależności**: PH03-SLACK-001
- **Opis**: Dodać testy security dla Slack (analogiczne do Monday)
- **Definition of Done**:
  - Plik `tests/slack-readonly.test.ts` istnieje
  - Test: write operations są blokowane
  - Test: read operations działają
- **Testy automatyczne**: `npx tsx tests/slack-readonly.test.ts` przechodzi
- **Testy manualne**: N/A

---

## EPIK: Faza 04 — Plan-first (ask-before-act)

**Branch**: `phase/04-plan-first`  
**Entry criteria**: Faza 03 zakończona (narzędzia dostępne)  
**Exit criteria**: System zadaje pytania przy brakujących must-have, tool calls tylko po potwierdzeniu

### PH04-PLAN-001: Slot extraction dla UC-01 (Deal Enablement)
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Implementacja slot extraction dla UC-01 zgodnie z USE_CASES.md
- **Definition of Done**:
  - Ekstrakcja slotów: `geography` (must-have), `theme` (must-have), `audience` (must-have), `timeRange` (optional), `outputFormat` (optional), `meetingContext` (optional)
  - Jeśli must-have slot brakuje → system zadaje pytanie
  - Jeśli slot jest w promptcie → ekstraktuje i pomija pytanie
- **Testy automatyczne**:
  - Test: parser slotów ekstraktuje geografię z promptu
  - Test: parser slotów wykrywa brak must-have slotów
  - Test: parser slotów używa wartości domyślnych dla optional
- **Testy manualne**:
  - Wpisz "Znajdź projekt dla donora" bez geografii → dostajesz pytanie o geografię
  - Wpisz "Znajdź projekt w Kenii o edukacji" → geografia i temat ekstraktowane, brak pytań

### PH04-PLAN-002: Slot extraction dla UC-02 (Ad-hoc Reporting)
- **Priorytet**: P0
- **Zależności**: PH04-PLAN-001
- **Opis**: Implementacja slot extraction dla UC-02
- **Definition of Done**:
  - Ekstrakcja slotów: `metric` (must-have), `metricDefinition` (jeśli niejednoznaczna), `filters` (optional), `outputFormat` (optional)
  - Jeśli metryka niejednoznaczna → system zadaje o precyzję
- **Testy automatyczne**:
  - Test: parser wykrywa niejednoznaczne metryki
  - Test: parser ekstraktuje filtry z promptu
- **Testy manualne**:
  - Wpisz "ile projektów" → metryka ekstraktowana
  - Wpisz "jaki progres" → system pyta o precyzję (progres = % KPI vs liczba beneficjentów)

### PH04-PLAN-003: Slot extraction dla UC-03 (Draft Mail)
- **Priorytet**: P0
- **Zależności**: PH04-PLAN-001
- **Opis**: Implementacja slot extraction dla UC-03
- **Definition of Done**:
  - Ekstrakcja slotów: `recipient` (must-have), `purpose` (must-have), `projects` (must-have), `tone` (optional), `language` (optional), `callToAction` (optional)
- **Testy automatyczne**:
  - Test: parser ekstraktuje recipient i purpose
  - Test: parser wykrywa brak must-have slotów
- **Testy manualne**:
  - Wpisz "Wygeneruj mail" bez odbiorcy → dostajesz pytanie o odbiorcę
  - Wpisz "Wygeneruj mail dla organizacji X jako follow-up" → recipient i purpose ekstraktowane

### PH04-PLAN-004: Plan generation i prezentacja
- **Priorytet**: P0
- **Zależności**: PH04-PLAN-001, PH04-PLAN-002, PH04-PLAN-003
- **Opis**: Generowanie czytelnego planu działania przed tool calls
- **Definition of Done**:
  - System generuje plan: "Planuję: 1) wyszukać projekty w X z tagiem Y, 2) wygenerować narrację, 3) dodać źródła"
  - Plan jest prezentowany użytkownikowi w czytelnej formie
  - System czeka na potwierdzenie przed uruchomieniem tool calls
- **Testy automatyczne**:
  - Test: plan generation dla UC-01/02/03
  - Test: plan zawiera wszystkie kroki działania
- **Testy manualne**:
  - Po uzupełnieniu slotów → dostajesz plan działania
  - Po potwierdzeniu → system uruchamia tool calls
  - Bez potwierdzenia → tool calls nie są uruchamiane

### PH04-PLAN-005: Stop & ask triggers
- **Priorytet**: P1
- **Zależności**: PH04-PLAN-004
- **Opis**: Implementacja triggerów "stop & ask" zgodnie z USE_CASES.md
- **Definition of Done**:
  - Brak must-have slotów → system nie uruchamia tool calls, tylko zadaje pytania
  - Wieloznaczność metryki/definicji → system pyta o precyzję
  - Wieloznaczność boardu/źródła → system pyta o wybór
  - Zbyt duży zakres danych → system prosi o zawężenie
  - Niska pewność interpretacji → system pyta o potwierdzenie intencji
- **Testy automatyczne**:
  - Test: brak must-have → brak tool calls
  - Test: wieloznaczność → pytanie o precyzję
- **Testy manualne**:
  - Wpisz niejednoznaczne zapytanie → system pyta o doprecyzowanie
  - Wpisz zapytanie zbyt szerokie → system prosi o zawężenie

---

## EPIK: Faza 05 — Evidence policy

**Branch**: `phase/05-evidence-policy`  
**Entry criteria**: Faza 04 zakończona (mamy spójny orchestrator)  
**Exit criteria**: Nie da się uzyskać liczb bez źródeł w finalnym output

### PH05-EVIDENCE-001: Format odpowiedzi (Wyniki/Źródła/Do potwierdzenia)
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Implementacja formatu odpowiedzi zgodnie z USE_CASES.md
- **Definition of Done**:
  - Każda odpowiedź zawiera sekcje: `Wyniki`, `Źródła`, `Do potwierdzenia` (jeśli dotyczy)
  - Format źródła: link do Monday item + nazwa kolumny, lub link do ImpactLog entry
  - Format "Do potwierdzenia": `⚠️ Brak źródła: [teza] — proszę zweryfikować w [miejsce]`
- **Testy automatyczne**:
  - Test: format odpowiedzi zawiera wymagane sekcje
  - Test: źródła mają poprawny format (link + kolumna)
- **Testy manualne**:
  - Poproś o metrykę → odpowiedź zawiera sekcję "Źródła" z linkami
  - Poproś o dane bez źródła → odpowiedź zawiera sekcję "Do potwierdzenia"

### PH05-EVIDENCE-002: Walidator evidence (liczby/metryki)
- **Priorytet**: P0
- **Zależności**: PH05-EVIDENCE-001
- **Opis**: Walidator sprawdzający, czy każda liczba/metryka ma źródło
- **Definition of Done**:
  - Przed wygenerowaniem odpowiedzi system sprawdza, czy każda liczba/teza ma źródło
  - Jeśli brak → przenosi do sekcji "Do potwierdzenia" zamiast generować bez źródła
  - System nie może wygenerować faktów bez źródła
- **Testy automatyczne**:
  - Test: walidator wykrywa brak źródła dla liczby
  - Test: walidator przenosi do "Do potwierdzenia" zamiast generować bez źródła
- **Testy manualne**:
  - Poproś o metrykę bez danych w Monday → odpowiedź zawiera "Do potwierdzenia", nie wymyśla liczby

### PH05-EVIDENCE-003: Linkowanie źródeł do Monday items
- **Priorytet**: P1
- **Zależności**: PH05-EVIDENCE-002
- **Opis**: Generowanie linków do Monday items w odpowiedziach
- **Definition of Done**:
  - Każda liczba/metryka z Monday ma link: `https://monday.com/boards/{boardId}/items/{itemId}`
  - Link zawiera informację o kolumnie: `[Monday Item #123, kolumna "Beneficjenci"](link)`
- **Testy automatyczne**:
  - Test: generowanie linków do Monday items
  - Test: format linku jest poprawny
- **Testy manualne**:
  - Poproś o dane z Monday → odpowiedź zawiera klikalne linki do items

---

## EPIK: Faza 06 — Context scaling + hardening

**Branch**: `phase/06-context-budget-hardening`  
**Entry criteria**: Fazy 03–05 zakończone  
**Exit criteria**: Brak dumpowania dużych tabel, system prosi o zawężenie przy zbyt dużym zakresie

### PH06-CONTEXT-001: Budżet tokenów (token budget)
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Implementacja budżetu tokenów zgodnie z PROJECT_SPEC.md sekcja 4.4.2
- **Definition of Done**:
  - Budżet na: system prompt + tool schemas, historia rozmowy, kontekst z integracji, odpowiedź modelu
  - System śledzi użycie tokenów per request
  - Gdy budżet przekroczony → degradacja kontrolowana (nie losowe ucinanie)
- **Testy automatyczne**:
  - Test: budżet tokenów jest obliczany poprawnie
  - Test: przekroczenie budżetu → degradacja kontrolowana
- **Testy manualne**:
  - Długa historia rozmowy → system kompresuje starsze wiadomości
  - Duży payload z Monday → system ogranicza liczbę rekordów

### PH06-CONTEXT-002: Kontrolowana degradacja (degradation strategy)
- **Priorytet**: P0
- **Zależności**: PH06-CONTEXT-001
- **Opis**: Implementacja strategii degradacji zgodnie z PROJECT_SPEC.md sekcja 4.4.6
- **Definition of Done**:
  - Kolejność degradacji: 1) usuń nieistotne fragmenty historii, 2) zmniejsz top-K chunków, 3) zwiększ agresywność kompresji, 4) poproś użytkownika o doprecyzowanie
  - Degradacja jest kontrolowana i przewidywalna
- **Testy automatyczne**:
  - Test: degradacja następuje w określonej kolejności
  - Test: degradacja nie usuwa krytycznych danych
- **Testy manualne**:
  - Bardzo długa historia → system kompresuje starsze wiadomości, zachowuje kontekst
  - Zbyt duże dane → system prosi o zawężenie zakresu

### PH06-CONTEXT-003: Payload control dla integracji (Monday/Slack)
- **Priorytet**: P1
- **Zależności**: PH06-CONTEXT-001
- **Opis**: Ograniczenie rozmiaru danych z integracji przed wstrzyknięciem do promptu
- **Definition of Done**:
  - Monday: maksymalnie 50 rekordów na request, selekcja pól, agregacja
  - Slack: maksymalnie 20 wiadomości na request, selekcja pól
  - Jeśli więcej → system prosi o zawężenie zakresu
- **Testy automatyczne**:
  - Test: Monday zwraca max 50 rekordów
  - Test: Slack zwraca max 20 wiadomości
- **Testy manualne**:
  - Zapytanie o duży board → system proponuje zawężenie lub zwraca summary
  - Zapytanie o długi Slack thread → system zwraca ostatnie 20 wiadomości

### PH06-CONTEXT-004: Rate limiting per user (opcjonalnie)
- **Priorytet**: P2
- **Zależności**: PH06-CONTEXT-001
- **Opis**: Implementacja rate limiting per user
- **Definition of Done**:
  - Limit: np. 100 requestów na godzinę per user
  - Po przekroczeniu → 429 Too Many Requests
  - Logowanie rate limit violations
- **Testy automatyczne**:
  - Test: rate limiting działa per user
  - Test: przekroczenie limitu → 429
- **Testy manualne**:
  - Wysyłanie wielu requestów szybko → po limicie dostajesz 429

---

## Otwarte punkty (do doprecyzowania)

### DB Policy
- **Pytanie**: Czy DB jest obowiązkowa w każdym środowisku czy opcjonalna (degradacja)?
- **Status**: Do ustalenia w Faza 02
- **Wpływ**: PH02-DB-001

### Slack Storage
- **Pytanie**: Czy dane Slack mają być tylko "live read", czy też cache/sync do DB?
- **Status**: Do ustalenia w Faza 03
- **Wpływ**: PH03-SLACK-001

### AI Provider
- **Pytanie**: Repo ma elementy Anthropic i Google — docelowo single-provider zgodnie z `AI_PROVIDER`?
- **Status**: Do ustalenia przed Faza 04
- **Wpływ**: PH04-PLAN-001 (może wymagać różnych promptów)

### Monday Board Restriction
- **Pytanie**: W prod nadal "allowlist boardów" czy pełny dostęp (zależny od polityki firmy)?
- **Status**: Do ustalenia w Faza 03
- **Wpływ**: PH03-MONDAY-001

---

## Statystyki backlogu

- **Faza 00**: 2 zadania (✅ ukończone)
- **Faza 01**: 4 zadania (P0: 2, P1: 1, P2: 1) (✅ ukończone 2025-12-19)
- **Faza 02**: 4 zadania (P0: 3, P1: 1)
- **Faza 03**: 5 zadań (P0: 1, P1: 2, P2: 2)
- **Faza 04**: 5 zadań (P0: 4, P1: 1)
- **Faza 05**: 3 zadania (P0: 2, P1: 1)
- **Faza 06**: 4 zadania (P0: 2, P1: 1, P2: 1)

**Łącznie**: 27 zadań

---

## Notatki

- Zadania są uporządkowane wg faz i priorytetów
- Zależności są oznaczone w polu "Zależności"
- Każde zadanie ma Definition of Done i scenariusze testowe
- Otwarte punkty są oznaczone na końcu backlogu

