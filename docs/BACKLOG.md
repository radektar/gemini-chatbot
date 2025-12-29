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
**Status**: ✅ Ukończone (2025-12-22) - PH03-MONDAY-001/002 i PH03-SLACK-001/002 ukończone  
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
**Status**: ✅ Ukończone (2025-12-22)
- **Priorytet**: P1
- **Zależności**: PH01-AUTH-002
- **Opis**: Skonfigurować Slack integration jako read-only
- **Definition of Done**:
  - ✅ Slack tools mają minimal scopes: `channels:read`, `channels:history`
  - ✅ Brak write permissions (explicit blacklist w `lib/slack-readonly.ts`)
  - ✅ Spójny log/audit dla Slack API calls (audit logging w `client.ts`)
  - ✅ Tylko publiczne kanały dostępne (prywatne, DM, mpim zablokowane)
  - ✅ Opcjonalny whitelist (`SLACK_ALLOWED_CHANNELS`)
- **Testy automatyczne**:
  - ✅ Test: Slack tools nie mają write operations (`tests/slack-readonly.test.ts`)
  - ✅ Test: Slack API calls są logowane (audit logging)
- **Testy manualne**:
  - ✅ Poproś o Slack search → dostajesz wynik (zweryfikowane: wyszukiwanie "Lenovo" zwraca 10 wyników)
  - ⏳ Poproś o wysłanie wiadomości → odmowa (do przetestowania w UI)

### PH03-SLACK-002: Testy automatyczne Slack security
**Status**: ✅ Ukończone (2025-12-22)
- **Priorytet**: P2
- **Zależności**: PH03-SLACK-001
- **Opis**: Dodać testy security dla Slack (analogiczne do Monday)
- **Definition of Done**:
  - ✅ Plik `tests/slack-readonly.test.ts` istnieje
  - ✅ Test: write operations są blokowane (12 testów, wszystkie przechodzą)
  - ✅ Test: read operations działają
  - ✅ Test: channel access validation (public allowed, private/DM/mpim blocked)
- **Testy automatyczne**: ✅ `npx tsx tests/slack-readonly.test.ts` przechodzi (12/12 testów)
- **Testy manualne**: N/A

---

## EPIK: Faza 04 — Plan-first (ask-before-act) + Feedback Loop

**Branch**: `phase/04-plan-first`  
**Entry criteria**: Faza 03 zakończona (narzędzia dostępne)  
**Exit criteria**: 
- System elastycznie obsługuje różne typy zapytań (nie tylko UC-01/02/03)
- Przy niskiej pewności (confidence < 0.7): system pyta zamiast zgadywać
- Plan jest zawsze prezentowany przed tool calls
- Użytkownik może ocenić odpowiedź (👍/👎), feedback zapisywany do DB

---

### CZĘŚĆ A: Intent + Confidence Architecture

### PH04-INTENT-001: Uniwersalny QueryContext i slot extraction
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Implementacja elastycznego meta-schematu zamiast hardcoded UC slots
- **Definition of Done**:
  - Interface `QueryContext` z polami: `intent`, `dataSources`, `audience`, `output`
  - Każde pole ma `confidence: number` (0-1)
  - Prompt do ekstrakcji slotów z dowolnego zapytania (nie per-UC)
  - Ekstrakcja działa dla UC-01/02/03 oraz nowych przypadków
- **Testy automatyczne**:
  - Test: ekstrakcja intent z promptu "Znajdź projekt" → action: "find", confidence: 1.0
  - Test: ekstrakcja z niejasnego promptu → confidence < 0.5
  - Test: ekstrakcja audience z "dla donora" → type: "donor", confidence: 1.0
- **Testy manualne**:
  - Wpisz "Znajdź projekt edukacyjny w Kenii" → wszystkie sloty z wysoką confidence
  - Wpisz "Coś o projektach" → niska confidence, system pyta o doprecyzowanie

### PH04-INTENT-002: Confidence-based prompting
- **Priorytet**: P0
- **Zależności**: PH04-INTENT-001
- **Opis**: System pyta tylko gdy confidence < threshold (0.7)
- **Definition of Done**:
  - Threshold confidence = 0.7 (konfigurowalny)
  - Jeśli confidence >= 0.7 dla wszystkich critical slots → kontynuuj bez pytań
  - Jeśli confidence < 0.7 dla critical slot → zadaj pytanie
  - Jeśli confidence < 0.3 dla intent → zapytaj o intencję
- **Testy automatyczne**:
  - Test: wysokie confidence → brak pytań
  - Test: niskie confidence → pytanie o doprecyzowanie
  - Test: bardzo niskie confidence intent → pytanie o intencję
- **Testy manualne**:
  - Wpisz jasne zapytanie → system nie pyta, pokazuje plan
  - Wpisz niejasne zapytanie → system pyta zanim pokaże plan

### PH04-INTENT-003: Plan generation i prezentacja
- **Priorytet**: P0
- **Zależności**: PH04-INTENT-002
- **Opis**: Generowanie czytelnego planu działania przed tool calls
- **Definition of Done**:
  - System generuje plan na podstawie QueryContext
  - Plan zawiera: co zrobi, jakie narzędzia użyje, jakie filtry
  - Format: "Mój plan: 1) ... 2) ... Doprecyzuj jeśli chcesz: ..."
  - System czeka na potwierdzenie przed uruchomieniem tool calls
- **Testy automatyczne**:
  - Test: plan generation z QueryContext
  - Test: plan zawiera wszystkie kroki działania
- **Testy manualne**:
  - Po ekstrakcji slotów → dostajesz plan działania
  - Po potwierdzeniu → system uruchamia tool calls
  - Możesz edytować plan przed potwierdzeniem

### PH04-INTENT-004: Generic stop & ask triggers
- **Priorytet**: P1
- **Zależności**: PH04-INTENT-003
- **Opis**: Uniwersalne triggery "stop & ask" (nie per-UC)
- **Definition of Done**:
  - Trigger: intent.confidence < 0.5 → pytaj o intencję
  - Trigger: dataSources.confidence < 0.5 → pytaj o źródło danych
  - Trigger: ambiguous metric/term → pytaj o definicję
  - Trigger: data scope too large (>100 records) → pytaj o zawężenie
  - Trigger: average confidence < 0.4 → pytaj o doprecyzowanie całości
- **Testy automatyczne**:
  - Test: każdy trigger działa poprawnie
  - Test: kombinacja triggerów (np. niski intent + niski scope)
- **Testy manualne**:
  - Wpisz niejednoznaczne zapytanie → system pyta o doprecyzowanie
  - Wpisz zapytanie zbyt szerokie → system prosi o zawężenie

---

### CZĘŚĆ B: Feedback Loop (ocena odpowiedzi)

### PH04-FEEDBACK-001: Schemat DB dla feedbacku (MessageFeedback)
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Tabela do przechowywania ocen odpowiedzi AI
- **Definition of Done**:
  - Tabela `MessageFeedback` w `db/schema.ts`
  - Pola: id, chatId, userId, messageId, rating (1/-1), comment, userQuery, assistantResponse, toolsUsed, createdAt
  - Indeksy: chatId, userId, rating, createdAt
  - Migracja Drizzle utworzona
- **Testy automatyczne**:
  - Test: migracja wykonuje się bez błędów
  - Test: schemat zawiera wszystkie pola
- **Testy manualne**:
  - Uruchomienie `npx tsx db/migrate` → tabela utworzona
  - Sprawdzenie schematu w DB → wszystkie pola i indeksy istnieją

### PH04-FEEDBACK-002: API endpoint /api/feedback
- **Priorytet**: P0
- **Zależności**: PH04-FEEDBACK-001
- **Opis**: Endpoint do zapisywania feedbacku
- **Definition of Done**:
  - POST `/api/feedback` zapisuje feedback do DB
  - Walidacja: rating musi być 1 lub -1
  - Wymaga sesji (401 bez auth)
  - Zwraca feedbackId po zapisie
  - GET `/api/feedback?period=7d` zwraca statystyki (opcjonalnie)
- **Testy automatyczne**:
  - Test: POST bez sesji → 401
  - Test: POST z sesją i poprawnymi danymi → 200
  - Test: POST z nieprawidłowym rating → 400
- **Testy manualne**:
  - POST z curl/Postman → feedback zapisany w DB
  - Sprawdzenie DB → rekord istnieje z poprawnymi danymi

### PH04-FEEDBACK-003: Komponent FeedbackButtons
- **Priorytet**: P0
- **Zależności**: PH04-FEEDBACK-002
- **Opis**: UI do oceny odpowiedzi (thumbs up/down)
- **Definition of Done**:
  - Komponent `components/custom/feedback-buttons.tsx`
  - Przyciski 👍 i 👎 przy odpowiedziach AI
  - Po kliknięciu → wysyłka do `/api/feedback`
  - Stan: idle → submitting → submitted
  - Po 👎 → opcja dodania komentarza
  - Animacje i feedback wizualny (check icon po zapisie)
- **Testy automatyczne**: N/A (komponent UI)
- **Testy manualne**:
  - Kliknij 👍 → przycisk zmienia stan, "Dziękujemy za opinię!"
  - Kliknij 👎 → pojawia się pole komentarza
  - Sprawdź DB → feedback zapisany

### PH04-FEEDBACK-004: Integracja FeedbackButtons z Message
- **Priorytet**: P0
- **Zależności**: PH04-FEEDBACK-003
- **Opis**: Dodanie przycisków feedbacku do komponentu Message
- **Definition of Done**:
  - `FeedbackButtons` renderowany przy odpowiedziach assistant
  - Tylko przy ostatniej odpowiedzi AI w konwersacji
  - Props: chatId, messageId, userQuery, assistantResponse, toolsUsed
  - Feedback zapisywany z pełnym kontekstem
- **Testy automatyczne**: N/A (integracja UI)
- **Testy manualne**:
  - Wyślij wiadomość → odpowiedź AI ma przyciski 👍/👎
  - Wyślij kolejną wiadomość → tylko najnowsza odpowiedź ma przyciski
  - Kliknij feedback → sprawdź DB czy zapisał userQuery i assistantResponse

### PH04-FEEDBACK-005: Funkcje DB dla feedbacku
- **Priorytet**: P1
- **Zależności**: PH04-FEEDBACK-001
- **Opis**: Funkcje w db/queries.ts do obsługi feedbacku
- **Definition of Done**:
  - `saveFeedback(data)` — zapisuje feedback
  - `getFeedbackStats(period)` — zwraca statystyki (total, positive, negative, rate)
  - `getFeedbackByChat(chatId)` — feedback dla konkretnego chatu
  - `getRecentNegativeFeedback(limit)` — ostatnie negatywne oceny do analizy
- **Testy automatyczne**:
  - Test: saveFeedback zapisuje poprawnie
  - Test: getFeedbackStats zwraca prawidłowe liczby
- **Testy manualne**:
  - Zapisz kilka feedbacków → getFeedbackStats zwraca poprawne statystyki

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
- **Research**: Szczegółowe uzasadnienie limitów w `docs/PH06_CONTEXT_RESEARCH.md`
- **Uzasadnienie naukowe**:
  - **"Lost in the Middle"** (Liu et al., TACL 2024): Modele mają U-kształtną krzywą uwagi - informacje w środku kontekstu są ignorowane (spadek accuracy do 20%)
  - **RAG saturation**: Badania pokazują, że >20 dokumentów nie poprawia jakości odpowiedzi
  - **Token estimation**: Monday item ~150-300 tokenów, Slack message ~100-300 tokenów
  - **Efektywne wykorzystanie**: Optymalne przy 70-75% context window (nie max)
- **Definition of Done**:
  - Monday: **30-50 rekordów** na request (domyślnie 30), selekcja pól, agregacja
  - Slack: **15-25 wiadomości** na request (domyślnie 15), selekcja pól
  - Trigger "zawęź zakres": Monday >100 potencjalnych rekordów, Slack >50 wyników
  - Kompaktowy JSON (bez pretty-print) - oszczędność ~50% tokenów
  - Budżet dla danych integracji: 30-40K tokenów (15-25% z 200K context)
- **Strategie degradacji** (w kolejności):
  1. Selekcja pól (tylko kluczowe kolumny)
  2. Redukcja liczby rekordów (top-N najbardziej relevant)
  3. Agregacja (summary zamiast pełnych danych)
  4. Pytanie użytkownika o zawężenie
- **Testy automatyczne**:
  - Test: Monday zwraca max 50 rekordów (konfigurowalny limit)
  - Test: Slack zwraca max 25 wiadomości (konfigurowalny limit)
  - Test: Trigger "zawęź zakres" przy >100 rekordów Monday
  - Test: Kompaktowy JSON output (bez whitespace)
  - Test: Token estimation dla sample payload
- **Testy manualne**:
  - Zapytanie o duży board (>100 items) → system proponuje zawężenie z liczbą rekordów
  - Zapytanie o długi Slack thread → system zwraca ostatnie 15-25 wiadomości
  - Sprawdzenie logów → widoczne "Payload: X items, ~Y tokens"

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

## EPIK: Faza 07 — Board Filters Configuration

**Branch**: `phase/07-board-filters`  
**Entry criteria**: Faza 06 zakończona  
**Exit criteria**: 
- Filtry są automatycznie aplikowane przy każdym zapytaniu do Monday
- Logi informują o zastosowanych filtrach (ile rekordów przed/po)
- Wyłączenie filtra (`enabled: false`) działa
- Testy automatyczne przechodzą
- Dokumentacja zarządzania filtrami istnieje

### PH07-FILTERS-001: Struktura konfiguracji filtrów
- **Priorytet**: P0
- **Zależności**: Brak
- **Opis**: Utworzenie pliku konfiguracyjnego z definicjami filtrów per board
- **Definition of Done**:
  - Plik `lib/monday-board-filters.ts` istnieje
  - Interface `ColumnFilter` z polami: columnId, operator, value
  - Interface `BoardFilter` z polami: boardId, boardName, description, enabled, postFilters
  - Map `BOARD_FILTERS` z przykładowymi filtrami
  - Funkcja `getFilterForBoard(boardId)` zwraca filtr lub null
- **Testy automatyczne**:
  - Test: `getFilterForBoard()` zwraca poprawny filtr dla istniejącego boarda
  - Test: `getFilterForBoard()` zwraca null dla nieistniejącego boarda
- **Testy manualne**:
  - Sprawdzenie struktury pliku → wszystkie interfejsy i funkcje istnieją

### PH07-FILTERS-002: Silnik filtrowania post-fetch
- **Priorytet**: P0
- **Zależności**: PH07-FILTERS-001
- **Opis**: Implementacja logiki aplikowania filtrów na wynikach z Monday API
- **Definition of Done**:
  - Plik `lib/monday-filter-engine.ts` istnieje
  - Funkcja `applyPostFilters(items, filter)` aplikuje filtry
  - Obsługa `requiredColumns` - filtruje items bez wypełnionych kolumn
  - Obsługa `columnMatches` - filtruje items według operatorów (equals, not_equals, contains, in, not_in, not_empty)
  - Obsługa `excludeGroups` - wyklucza items z określonych grup
  - Logowanie: "Filtered: X -> Y items" dla boarda
  - Obsługa `enabled: false` - pomija filtrowanie
- **Testy automatyczne**:
  - Test: `applyPostFilters()` filtruje requiredColumns
  - Test: `applyPostFilters()` filtruje columnMatches (wszystkie operatory)
  - Test: `applyPostFilters()` wyklucza grupy
  - Test: `enabled: false` pomija filtrowanie
  - Test: Brak filtra = brak filtrowania
- **Testy manualne**:
  - Zapytanie o board z filtrem → mniej rekordów niż bez filtra
  - Sprawdzenie logów → widoczne "Filtered: X -> Y items"

### PH07-FILTERS-003: Integracja z MCP i native client
- **Priorytet**: P0
- **Zależności**: PH07-FILTERS-002
- **Opis**: Integracja filtrów z istniejącym kodem Monday MCP i native client
- **Definition of Done**:
  - `integrations/mcp/init.ts` - `callMondayMCPTool()` aplikuje filtry po pobraniu danych
  - `integrations/monday/client.ts` - `getBoardItems()` aplikuje filtry po pobraniu danych
  - Filtry są aplikowane przed zwróceniem wyników do modelu AI
  - Logi zawierają informację o zastosowanych filtrach
- **Testy automatyczne**:
  - Test: `callMondayMCPTool()` aplikuje filtry dla boarda z filtrem
  - Test: `getBoardItems()` aplikuje filtry dla boarda z filtrem
  - Test: Brak filtra = brak zmian w wynikach
- **Testy manualne**:
  - Zapytanie przez MCP o board z filtrem → wyniki przefiltrowane
  - Zapytanie przez native client o board z filtrem → wyniki przefiltrowane
  - Sprawdzenie logów → widoczne informacje o filtrowaniu

### PH07-FILTERS-004: Testy automatyczne filtrów
- **Priorytet**: P1
- **Zależności**: PH07-FILTERS-003
- **Opis**: Kompleksowe testy automatyczne dla systemu filtrów
- **Definition of Done**:
  - Plik `tests/monday-board-filters.test.ts` istnieje
  - Testy pokrywają wszystkie operatory filtrów
  - Testy pokrywają kombinacje filtrów (requiredColumns + columnMatches + excludeGroups)
  - Testy pokrywają edge cases (pusty filtr, disabled filter, brak filtra)
- **Testy automatyczne**: `npx tsx tests/monday-board-filters.test.ts` przechodzi
- **Testy manualne**: N/A

### PH07-FILTERS-005: Dokumentacja zarządzania filtrami
- **Priorytet**: P1
- **Zależności**: PH07-FILTERS-001
- **Opis**: Dokumentacja jak dodawać, edytować i usuwać filtry
- **Definition of Done**:
  - Plik `docs/MONDAY_BOARD_FILTERS.md` istnieje
  - Zawiera: instrukcje CRUD filtrów, przykłady typowych filtrów, troubleshooting
  - Link do dokumentacji w `PROJECT_SPEC.md` sekcja 11
- **Testy automatyczne**: N/A (dokumentacja)
- **Testy manualne**: Review checklist — dokumentacja jest czytelna i kompletna

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

### Feedback Analytics Dashboard
- **Pytanie**: Czy potrzebny dedykowany dashboard do analizy feedbacku, czy wystarczy export do zewnętrznego narzędzia?
- **Status**: Do ustalenia po Fazie 04
- **Wpływ**: PH04-FEEDBACK-005 (może wymagać dodatkowego endpointu)

### Confidence Threshold Tuning
- **Pytanie**: Czy threshold 0.7 jest optymalny? Może być konfigurowalny per-deployment?
- **Status**: Do ustalenia po pierwszych testach Fazy 04
- **Wpływ**: PH04-INTENT-002

---

## Statystyki backlogu

- **Faza 00**: 2 zadania (✅ ukończone)
- **Faza 01**: 4 zadania (P0: 2, P1: 1, P2: 1) (✅ ukończone 2025-12-19)
- **Faza 02**: 4 zadania (P0: 3, P1: 1) (✅ ukończone 2025-12-19)
- **Faza 03**: 5 zadań (P0: 1, P1: 2, P2: 2) (✅ ukończone 2025-12-22)
- **Faza 04**: 9 zadań (P0: 7, P1: 2) (⏳ nie rozpoczęte)
  - Część A (Intent + Confidence): 4 zadania
  - Część B (Feedback Loop): 5 zadań
- **Faza 05**: 3 zadania (P0: 2, P1: 1) (⏳ nie rozpoczęte)
- **Faza 06**: 4 zadania (P0: 2, P1: 1, P2: 1) (⏳ nie rozpoczęte)
- **Faza 07**: 5 zadań (P0: 3, P1: 2) (⏳ nie rozpoczęte)

**Łącznie**: 36 zadań
**Ukończone**: 15 zadań (42%)
**W trakcie**: 0 zadań
**Pozostało**: 21 zadań (58%)

---

## Notatki

- Zadania są uporządkowane wg faz i priorytetów
- Zależności są oznaczone w polu "Zależności"
- Każde zadanie ma Definition of Done i scenariusze testowe
- Otwarte punkty są oznaczone na końcu backlogu

