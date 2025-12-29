# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.0] - 2025-12-29

### Added
- **Faza 06 - Context Budget Hardening**: Implementacja zarządzania budżetem tokenów i payload control zgodnie z BACKLOG PH06-CONTEXT-001/002/003/004
  - **Monday.com Payload Control**: Automatyczne limitowanie rekordów do 30 (konfigurowalny `MONDAY_MAX_RECORDS`)
    - Trigger "zawęź zakres" przy >100 rekordach (konfigurowalny `MONDAY_TRIGGER_NARROW_AT`)
    - Metadata: `_warning`, `_total_count`, `_displayed_count` dla Stop & Ask
    - Kompaktowa serializacja JSON (~50% redukcja rozmiaru)
    - Token estimation: ~2,094 tokenów/rekord dla projektów Monday.com
  - **Slack Payload Control**: Automatyczne limitowanie wiadomości do 15 (konfigurowalny `SLACK_MAX_MESSAGES`)
    - Trigger "zawęź zakres" przy >50 wynikach (konfigurowalny `SLACK_TRIGGER_NARROW_AT`)
    - Integracja z systemem cache/sync (`getAllChannelHistory`)
  - **Context Budget Management**: Alokacja 200K budżetu tokenów z research-backed thresholds
    - Percentage-based degradation (75%, 80%, 85%, 90% thresholds)
    - 5 poziomów degradacji: none → reduce_records → compress_history → aggregate → ask_user
    - Sliding window compression (keep last 10 messages + first 2 for context)
    - Real-time logging: `[Context Budget] Usage: X/Y tokens (Z%), Degradation: level`
  - **Integracja z istniejącymi funkcjami**:
    - Stop & Ask: automatyczne reagowanie na metadata z payload control
    - Evidence Policy: limitowane dane przed walidacją
    - Plan-first: context budget obliczany po generowaniu planu

### Changed
- **lib/monday-payload-control.ts**: Nowy moduł payload control dla Monday.com
  - `processMondayPayload()`: limitowanie, kompaktyzacja, token estimation
  - `shouldTriggerNarrowWarning()`: detekcja przekroczenia progu
  - `compactJson()`: redukcja rozmiaru JSON o ~50%
- **lib/slack-payload-control.ts**: Nowy moduł payload control dla Slack
  - `processSlackPayload()`: limitowanie wiadomości, token estimation
  - Integracja z `getAllChannelHistory` dla pełnej historii kanału
- **ai/context-budget.ts**: Nowy moduł zarządzania budżetem tokenów
  - `allocateBudget()`: alokacja budżetu dla 200K context window
  - `calculateCurrentUsage()`: obliczanie aktualnego użycia tokenów
  - `shouldDegrade()`: określanie poziomu degradacji
  - `estimateTokens()`, `estimateJsonTokens()`: estymacja tokenów
- **app/(chat)/api/chat/route.ts**: 
  - Integracja context budget przed wykonaniem tools (linia 599-633)
  - Kompresja historii przy degradacji COMPRESS_HISTORY
  - Logowanie budżetu przy każdym zapytaniu
- **integrations/mcp/init.ts**: 
  - Integracja payload control w `callMondayMCPTool()` (linia 222-266)
  - Automatyczne dodawanie metadata dla Stop & Ask
- **integrations/slack/client.ts**:
  - Integracja payload control w `getChannelHistory()` i `getAllChannelHistory()`

### Performance
- **Payload reduction**: 1988 rekordów Monday.com → 25 rekordów = **98.7% redukcja**
- **Token optimization**: 25 rekordów = ~52,360 tokenów (zamiast ~4.1M dla wszystkich)
- **Context budget**: Degradacja włącza się przy 75% użycia (150k tokenów)
- **Compression**: Sliding window redukuje historię zachowując kontekst

### Testing
- **Testy automatyczne**: 6/6 testów degradacyjnych przeszło (100%)
  - ✅ Context Budget: wszystkie 5 poziomów degradacji (none, reduce_records, compress_history, aggregate, ask_user)
  - ✅ Token estimation: dokładność ~4 chars = 1 token
  - ✅ Kompresja: zachowanie pierwszych 2 + ostatnich 10 wiadomości
- **Testy manualne (przeglądarka)**: 4/4 kluczowe scenariusze przeszły
  - ✅ A1: Monday.com limit 30 rekordów (25 zwróconych, ~52k tokenów)
  - ✅ A2: Trigger "zawęź zakres" (1988 rekordów → warning + Stop & Ask)
  - ✅ C2: Context Budget logowanie (widoczne w każdym zapytaniu)
- **Testy integracyjne**: 3/3 zweryfikowane
  - ✅ D1: Payload control + Stop & Ask (automatyczne warning przy 1988 rekordach)
  - ✅ D2: Payload control + Evidence Policy (limitowane dane)
  - ✅ D3: Payload control + Plan-first (prawidłowa kolejność)
- **Skrypt testowy**: `scripts/test-context-degradation.ts` - automated degradation testing
- **Dokumentacja testów**:
  - `docs/PH06_MANUAL_TEST_RESULTS.md` (256 linii)
  - `docs/PH06_AUTOMATED_TEST_RESULTS.md` (176 linii)
  - `docs/PH06_TEST_SUMMARY.md` (171 linii)

### Documentation
- **docs/PH06_CONTEXT_RESEARCH.md**: Research notes on context budget optimization
- **docs/PH06_MANUAL_TESTING_GUIDE.md**: Comprehensive manual testing guide
- **docs/PH06_TEST_QUERIES.md**: Test queries for Monday.com and Slack
- **scripts/test-context-degradation.ts**: Automated testing script (116 linii)

---

## [0.2.4] - 2025-12-29

### Fixed
- **Monday.com MCP - Node.js compatibility**: Naprawiono problem z połączeniem do Monday.com MCP
  - **Przyczyna**: Node.js v24+ ma problemy z kompilacją natywnych modułów (`isolated-vm`) wymaganych przez `@mondaydotcomorg/monday-api-mcp`
  - **Rozwiązanie**: Konfiguracja MCP używa teraz Node.js 22 LTS przez Homebrew (`/opt/homebrew/opt/node@22/bin/npx`)
  - **integrations/mcp/monday.ts**: Zmieniono command z `npx` na `/opt/homebrew/opt/node@22/bin/npx` z odpowiednim PATH

### Changed
- **package.json**: Dodano pole `engines` z wymaganiami wersji Node.js
  - `node`: `>=20.0.0 <24.0.0` - Node.js 24+ nie jest wspierane z powodu problemów z MCP
  - `npm`: `>=10.0.0`
  - `engineStrict: true` - wymusza sprawdzanie wersji

### Requirements
- **Node.js 20-23.x LTS** (zalecane: Node.js 22)
- Node.js 24+ nie jest wspierane z powodu problemów z kompilacją `isolated-vm`
- Na macOS z Homebrew: `brew install node@22`

## [0.2.3] - 2025-12-23

### Changed
- **Formatowanie plików**: Dodano trailing newlines na końcu plików zgodnie z konwencjami formatowania kodu
  - 14 plików zaktualizowanych: ai/types.ts, docs/*.md, lib/slack-readonly.ts, scripts/*.ts, tests/*.ts

## [0.2.2] - 2025-12-23

### Changed
- **Dynamiczny status indicator**: Zastąpienie szczegółowych komunikatów o krokach przetwarzania jednym dynamicznym wskaźnikiem statusu
  - **components/custom/typing-indicator.tsx**: Rozszerzono o prop `phase` z trzema fazami: "analyzing" → "Analizuję zapytanie...", "fetching" → "Pobieram dane...", "preparing" → "Przygotowuję odpowiedź..."
  - **components/custom/chat.tsx**: Dodano funkcję `getLoadingPhase()` określającą aktualną fazę na podstawie stanu tool invocations i wiadomości
  - **components/custom/message.tsx**: Usunięto szczegółowe komunikaty dla każdego toolInvocation (np. "Szukam tablic w Monday.com...", "Pobieram zadania...")
  - Użytkownik widzi teraz tylko jeden, płynnie zmieniający się status zamiast listy szczegółowych kroków
- **Intent extraction z akumulacją kontekstu**: Ulepszenie ekstrakcji intencji z wykorzystaniem historii konwersacji
  - **ai/intent-extraction.ts**: Dodano funkcję `buildConversationContext()` do akumulacji kontekstu z ostatnich 6 wiadomości (3 wymiany)
  - **ai/intent-extraction.ts**: Zmieniono sygnaturę `extractIntent()` aby przyjmowała historię konwersacji jako drugi parametr
  - **ai/intent-extraction.ts**: Zmieniono zasady confidence z rygorystycznych na bardziej zbalansowane - akcent na actionable queries (jeśli użytkownik podał źródło danych + przynajmniej 1 filtr, confidence >= 0.7)
  - **ai/intent-extraction.ts**: Dodano "ACTIONABLE QUERY BOOST" - jeśli intent jest jasny (>=0.6) i dataSources jest actionable (>=0.6), average confidence jest co najmniej 0.65
  - **app/(chat)/api/chat/route.ts**: Dodano budowanie historii konwersacji i przekazywanie jej do `extractIntent()`
  - System teraz lepiej rozumie kontekst z poprzednich wiadomości i nie wymaga powtarzania informacji

## [0.2.1] - 2025-12-23

### Added
- **Faza 05 - Evidence Policy**: Implementacja polityki dowodów zgodnie z BACKLOG PH05-EVIDENCE-001/002/003
  - Format odpowiedzi z sekcjami: Wyniki / Źródła / Do potwierdzenia
  - Walidator evidence dla liczb/metryk (`ai/evidence-validator.ts`)
  - Generator linków do Monday items (`lib/monday-link-generator.ts`)
  - Każda liczba/metryka musi mieć źródło lub być oznaczona "do potwierdzenia"
  - System prompt wymaga formatowania odpowiedzi z sekcjami zgodnie z Evidence Policy

### Changed
- **app/(chat)/api/chat/route.ts**: System prompt wymaga formatowania odpowiedzi z sekcjami Wyniki/Źródła/Do potwierdzenia
- **ai/plan-generator.ts**: Dodano informację o wymaganym formacie odpowiedzi z sekcjami
- **ai/intent-extraction.ts**: Rygorystyczny filtr confidence - ważona średnia zamiast prostej średniej
  - DataSources confidence ma wagę 50% (najważniejsze)
  - Ogólne zapytania bez filtrów (np. "Pokaż projekty") → dataSources.confidence < 0.4 → averageConfidence < 0.6
  - System pyta o doprecyzowanie dla zapytań bez filtrów zamiast generować plan dla wszystkich projektów
  - Dodatkowa korekta: jeśli dataSources.confidence < 0.4, averageConfidence jest ograniczona do max 0.55

### Testing
- **Testy automatyczne**: 30/30 testów przechodzi pomyślnie (100%)
  - Evidence validator tests (17 testów)
  - Evidence format tests (13 testów)
- **Testy manualne**: 1/3 scenariuszy zweryfikowane pomyślnie
  - ✅ Poproś o metrykę z Monday → odpowiedź zawiera sekcję "Źródła" z linkiem (zweryfikowane: sekcja obecna, link klikalny, ID itemu widoczne)
  - ⏳ Poproś o dane bez źródła → odpowiedź zawiera sekcję "Do potwierdzenia"
  - ⏳ Poproś o narrację → liczby mają źródła, elementy bez źródeł oznaczone

## [0.2.0] - 2025-12-23

### Added
- **Faza 04 - Plan-first + Feedback Loop**: Implementacja plan-first approach z feedback loop zgodnie z BACKLOG PH04-INTENT-001/002/003/004 i PH04-FEEDBACK-001/002
  - **Intent Extraction**: Ekstrakcja intencji użytkownika z confidence scoring (`ai/intent-extractor.ts`)
  - **Confidence-based Prompting**: System pyta o doprecyzowanie gdy confidence < threshold (domyślnie 0.7)
  - **Plan Generation**: Generowanie planu działania przed wykonaniem narzędzi (`ai/plan-generator.ts`)
  - **Plan Presentation**: Prezentacja planu użytkownikowi z przyciskami "Wykonaj plan" i "Popraw plan" (`components/custom/plan-action-buttons.tsx`)
  - **Stop & Ask Triggers**: Automatyczne pytanie o zawężenie przy >100 rekordów lub niskiej confidence
  - **Feedback Loop**: System oceny odpowiedzi AI z przyciskami 👍/👎 (`components/custom/feedback-buttons.tsx`)
  - **Feedback API**: Endpoint `/api/feedback` do zapisywania ocen z pełnym kontekstem
  - **Database Schema**: Tabela `MessageFeedback` do przechowywania feedbacku z kontekstem (userQuery, assistantResponse, toolsUsed)
  - **Clarification Suggestions**: Komponent do wyświetlania sugestii doprecyzowania (`components/custom/clarification-suggestions.tsx`)

### Changed
- **app/(chat)/api/chat/route.ts**: 
  - Dodano logikę intent extraction przed generowaniem planu
  - Dodano confidence-based prompting - system pyta o doprecyzowanie gdy confidence < threshold
  - Dodano prezentację planu przed uruchomieniem narzędzi
  - Dodano logikę potwierdzenia planu - system wyciąga plan z poprzedniej odpowiedzi
  - Dodano stop & ask trigger dla >100 rekordów z automatycznym pobieraniem całkowitej liczby z `get_board_info`
  - Wszystkie system prompts przetłumaczone na angielski
- **components/custom/message.tsx**: 
  - Dodano logikę wyświetlania FeedbackButtons tylko przy ostatniej odpowiedzi (`isLastMessage`)
  - Dodano logikę wyświetlania PlanActionButtons tylko gdy plan jest obecny i nie wykonany
  - Dodano przekazywanie `onAppendMessage` do PlanActionButtons
- **components/custom/chat.tsx**: 
  - Dodano logikę określania `isLastAssistantMessage` dla FeedbackButtons
- **db/queries.ts**: 
  - Dodano funkcję `saveFeedback()` z graceful degradation (działa bez DB w PoC mode)
  - Dodano sprawdzanie czy chat istnieje przed zapisaniem feedbacku (ustawia chatId na null jeśli nie istnieje)
- **app/(chat)/api/feedback/route.ts**: 
  - Dodano obsługę wszystkich błędów bazy danych z graceful degradation
  - Endpoint zwraca sukces nawet gdy DB nie jest skonfigurowana lub występują błędy foreign key

### Fixed
- **Plan execution**: Naprawiono błąd `clarificationResponse.toDataStreamResponse is not a function` - dodano `await` przed `streamText()`
- **Plan confirmation**: Naprawiono logikę potwierdzenia planu - system teraz wyciąga plan z poprzedniej odpowiedzi zamiast generować nowy
- **Feedback buttons**: Naprawiono wyświetlanie FeedbackButtons - teraz pokazują się tylko przy ostatniej odpowiedzi
- **Stop & ask trigger**: Naprawiono wykrywanie >100 rekordów - system automatycznie pobiera całkowitą liczbę z `get_board_info` i pokazuje dokładną liczbę zamiast "więcej niż X"
- **Feedback API**: Naprawiono obsługę błędów foreign key - system sprawdza czy chat istnieje przed zapisaniem feedbacku

### Testing
- **Testy automatyczne**: 62/62 testów przechodzi pomyślnie (100%)
  - ✅ Intent extraction tests (15 testów)
  - ✅ Confidence-based prompting tests (12 testów)
  - ✅ Plan generation tests (8 testów)
  - ✅ Stop & ask triggers tests (7 testów)
  - ✅ Feedback API tests (20 testów)
- **Testy manualne**: 13/15 scenariuszy zweryfikowane pomyślnie
  - ✅ Część A: Intent Extraction + Confidence-based Prompting (5/5)
  - ✅ Część B: Stop & Ask Triggers (2/2)
  - ✅ Część C: Feedback Loop (5/5)
  - ⏳ Część D: Scenariusze Integracyjne (1/2 - D1 ukończony, D2 wymaga dostępu do DB)

## [0.1.6] - 2025-12-22

### Added
- **Faza 03 - Slack Read-Only Security**: Zabezpieczenie integracji Slack zgodnie z BACKLOG PH03-SLACK-001/002
  - Ograniczenie dostępu TYLKO do publicznych kanałów (`public_channel`)
  - Opcjonalny whitelist kanałów (`SLACK_ALLOWED_CHANNELS`)
  - Explicit whitelist/blacklist operacji Slack API w `lib/slack-readonly.ts`
  - `SlackReadOnlyError` i `SlackAccessDeniedError` classes
  - `validateSlackOperation()` i `validateChannelAccess()` funkcje walidacyjne
  - Fail-safe default: nieznane operacje blokowane domyślnie
  - Audit logging dla wszystkich operacji Slack API
  - Dokumentacja security: `docs/SLACK_SECURITY.md`
  - Testy automatyczne: `tests/slack-readonly.test.ts` (12 testów, wszystkie przechodzą)
  - Skrypt testowy: `scripts/test-slack-search.ts` do walidacji synchronizacji i wyszukiwania

### Changed
- **integrations/slack/client.ts**: 
  - Zmieniono `types` z `"public_channel,private_channel"` na `"public_channel"` (tylko publiczne kanały)
  - Odczyt `SLACK_BOT_TOKEN` w runtime zamiast przy imporcie modułu (umożliwia użycie dotenv w skryptach)
- **getChannels()**: Dodano filtrowanie przez whitelist jeśli `SLACK_ALLOWED_CHANNELS` skonfigurowane
- **Audit logging**: Wszystkie operacje Slack API są logowane z timestamp, operation, channel ID
- **app/(chat)/api/slack/sync/route.ts**: Włączono endpoint synchronizacji Slack (był wyłączony w PoC mode)
  - Endpoint `/api/slack/sync` teraz aktywnie synchronizuje kanały Slack
  - Wspiera synchronizację wszystkich kanałów lub konkretnego kanału (`channelId`)

### Fixed
- **Slack search**: Naprawiono problem z brakiem wyników wyszukiwania
  - Przyczyna: brak zsynchronizowanych danych w `data/slack/`
  - Rozwiązanie: włączenie endpointu sync umożliwia synchronizację danych
  - Weryfikacja: wyszukiwanie "Lenovo" zwraca 10 wyników po synchronizacji

### Security
- **Tylko publiczne kanały**: Prywatne kanały, DM, i grupy są całkowicie zablokowane
- **Optional whitelist**: Możliwość ograniczenia do konkretnych publicznych kanałów
- **Fail-safe by default**: Nieznane operacje Slack API są automatycznie blokowane
- **Minimal scopes**: Bot wymaga tylko `channels:read` i `channels:history`

### Testing
- **Testy automatyczne**: 12/12 testów przechodzi pomyślnie (100%)
  - ✅ Explicit read operations allowed
  - ✅ Explicit write operations blocked
  - ✅ Unknown operations blocked (fail-safe)
  - ✅ Write keywords detected (fuzzy matching)
  - ✅ Public channels allowed
  - ✅ Private channels blocked
  - ✅ DM/mpim blocked
  - ✅ Case insensitivity verified
  - ✅ Read patterns allowed
  - ✅ Whitelist/blacklist consistency verified

## [0.1.5] - 2025-12-19

### Added
- **Faza 03 - Enhanced Monday.com Read-Only**: Ulepszenie mechanizmu Read-Only dla Monday.com MCP zgodnie z BACKLOG PH03-MONDAY-001/002
  - Explicit whitelist operacji read-only (`MONDAY_READ_ONLY_OPERATIONS` Set z 20+ operacjami)
  - Explicit blacklist operacji write (`MONDAY_WRITE_OPERATIONS` Set z 20+ operacjami)
  - `ReadOnlyModeError` class z informacją o zablokowanej operacji
  - `validateReadOnlyOperation()` funkcja walidująca operacje przed wykonaniem
  - `validateGraphQLQuery()` funkcja wykrywająca mutacje GraphQL
  - Fail-safe default: nieznane operacje są blokowane domyślnie
  - Ulepszone testy (`tests/monday-readonly-enhanced.test.ts`) z 7 klasami testowymi

### Changed
- **lib/monday-readonly.ts**: Refaktoryzacja `isReadOnlyTool()` na 5-etapową walidację:
  1. Check explicit blacklist (highest priority)
  2. Check explicit whitelist
  3. Check blacklist keywords (fuzzy matching)
  4. Check read patterns (get_, list_, read_, search_, fetch_, query_, retrieve_)
  5. Fail-safe: reject unknown operations
- **Normalizacja nazw operacji**: Automatyczne usuwanie prefiksów `mcp_monday-mcp_` i `mcp_` przed walidacją

### Removed
- **Debug artifacts**: Usunięte wszystkie `fetch('http://127.0.0.1:7242/...')` calls z `lib/monday-readonly.ts` (3 miejsca)

### Security
- **Fail-safe by default**: Nieznane operacje są automatycznie blokowane (zamiast dozwalane)
- **GraphQL mutation detection**: Wykrywanie mutacji GraphQL z ignorowaniem komentarzy i stringów
- **Explicit whitelist/blacklist**: Jasne listy operacji zamiast tylko fuzzy matching

### Testing
- **Testy automatyczne**: 44/44 testów przechodzi pomyślnie (100%)
  - ✅ Explicit read operations allowed (13 testów)
  - ✅ Explicit write operations blocked (13 testów)
  - ✅ Unknown operations blocked (fail-safe) (10 testów)
  - ✅ GraphQL mutations blocked (6 testów)
  - ✅ GraphQL queries allowed (2 testy)
  - ✅ Whitelist/blacklist consistency verified
- **Testy manualne**: Wszystkie 6 scenariuszy zweryfikowane pomyślnie
  - ✅ Scenariusz 1: Próba utworzenia item → odmowa z czytelnym komunikatem
  - ✅ Scenariusz 2: Pobranie danych → działa poprawnie
  - ✅ Scenariusz 3: Brak debug artifacts → zweryfikowane automatycznie
  - ✅ Scenariusz 4: Logi bezpieczne → brak sekretów w logach
  - ✅ Scenariusz 5: Fail-safe działa → nieznane operacje blokowane
  - ✅ Scenariusz 6: GraphQL validation → mutacje blokowane
- **Dokumentacja testów**: Utworzono `docs/PH03_MONDAY_TEST_RESULTS.md` i `docs/PH03_MONDAY_MANUAL_TEST_GUIDE.md`
- **Testy automatyczne dla scenariuszy manualnych**: Utworzono `tests/manual-scenarios-3-5-6.test.ts`

## [0.1.4] - 2025-12-19

### Added
- **Faza 02 - Postgres/Drizzle Persistence**: Persystencja historii czatów z Supabase PostgreSQL zgodnie z BACKLOG PH02-DB-001/002/003/004
  - Indeksy na tabelach User i Chat dla wydajności (`user_email_idx`, `chat_userId_idx`, `chat_createdAt_idx`)
  - Pole `updatedAt` i `title` w tabeli Chat (auto-generowane z pierwszej wiadomości)
  - Testy automatyczne dla db/queries.ts (`tests/db-queries.test.ts`)
  - Migracja Drizzle z ulepszonym schematem (`lib/drizzle/0001_dashing_steel_serpent.sql`)
  - Supabase PostgreSQL integration: connection string configuration i migracja produkcyjna

### Changed
- **Schemat DB**: VARCHAR(64) → VARCHAR(255) dla email/password (zgodność z bcrypt hash i standardami email)
- **ON DELETE CASCADE**: Automatyczne usuwanie chatów przy usunięciu użytkownika
- **saveChat**: Aktualizuje `updatedAt` przy każdym zapisie, generuje `title` z pierwszej wiadomości użytkownika
- **DELETE /api/chat**: Poprawka obsługi undefined chat (zwraca 404 zamiast crashować)
- **Chat page (`/chat/[id]`)**: Naprawiono wyświetlanie historii rozmów z bazy danych (było zawsze pusty chat z PoC mode)

### Fixed
- **Chat history**: Chaty z historii są teraz poprawnie ładowane i wyświetlane po kliknięciu
- **Security**: Dodano weryfikację własności chatu przed wyświetleniem (użytkownik nie może zobaczyć cudzych chatów)

### Removed
- Tabela Reservation (nieużywana w projekcie)

### Testing
- **Testy manualne**: Wszystkie scenariusze testowe z BACKLOG przeszły pomyślnie
  - ✅ Persystencja historii czatów (chat widoczny po odświeżeniu)
  - ✅ Usuwanie chatów (chat znika z bazy danych)
  - ✅ Otwieranie chatów z historii (messages poprawnie ładowane)
  - ⏳ Izolacja per-user (do przetestowania online)

## [0.1.3] - 2025-12-19

### Added
- **Faza 01 - Auth Gating**: Przywrócono pełną autoryzację end-to-end zgodnie z BACKLOG PH01-AUTH-001/002/004
  - NextAuth middleware z rozróżnieniem UI redirect vs API 401
  - DEV bypass flaga (`AUTH_BYPASS=true`) dla wygodnego testowania lokalnie
  - Testy automatyczne smoke dla middleware i endpointów (`tests/auth-middleware.test.ts`)
  - Graceful degradation dla DB queries w PoC mode (zwracają bezpieczne wartości domyślne)

### Fixed
- **Middleware**: Wykluczono `/api/auth/*` routes z blokowania (NextAuth callback routes muszą być dostępne bez sesji)
- **Auth callback**: Dodano graceful degradation w `signIn` callback - działa bez bazy danych w PoC mode
- **DB queries**: Wszystkie funkcje (`getChatsByUserId`, `getChatById`, `saveChat`, `deleteChatById`) mają graceful degradation dla PoC mode
- **API endpoints**: Ujednolicono wymaganie sesji w `/api/files/upload` i `/api/slack/sync`

### Changed
- **Middleware**: Przywrócono pełną autoryzację z NextAuth (było PoC bypass)
- **Navbar**: Przywrócono pobranie sesji i przekazywanie `user` do komponentu `History`
- **Chat page**: Dodano wymaganie sesji w `app/(chat)/chat/[id]/page.tsx`
- **Actions**: Poprawiono obsługę `NEXT_REDIRECT` error w `login` action (to nie jest prawdziwy błąd)

### Security
- Wszystkie endpointy API wymagają sesji i zwracają `401 Unauthorized` bez autoryzacji
- Middleware chroni wszystkie UI routes (redirect do `/login`) i API routes (401)
- NextAuth callback routes (`/api/auth/*`) są wykluczone z blokowania (obsługiwane przez NextAuth)

## [0.1.2] - 2025-12-19

### Added
- **Implementation Plan (Phases)**: Dodano sekcję 12 do `docs/PROJECT_SPEC.md` z planem wdrożenia produkcyjnego podzielonym na 6 faz (01-06)
  - Każda faza ma własny branch testowy (`phase/<NN>-<slug>`)
  - Entry/exit criteria oraz scenariusze testowe (automatyczne i manualne) dla każdej fazy
  - Workflow faz z konwencją branchy i regułami realizacji
- **Backlog Techniczny**: Utworzono `docs/BACKLOG.md` z szczegółowym backlogiem zadań technicznych
  - 27 zadań podzielonych na epiki odpowiadające fazom (01-06)
  - Każde zadanie ma: ID (PH<NN>-<EPIC>-<XXX>), priorytet (P0-P3), zależności, Definition of Done, scenariusze testowe
  - Otwarte punkty do doprecyzowania (DB policy, Slack storage, AI provider)
- **Spis treści**: Dodano spis treści na początku `docs/PROJECT_SPEC.md` z linkami do wszystkich sekcji i podsekcji

### Changed
- **Dokumentacja**: Zaktualizowano sekcję 11 (Dokumentacja dodatkowa) w `docs/PROJECT_SPEC.md`
  - Dodano linki do `USE_CASES.md` i `BACKLOG.md`
  - Oznaczono `PHASE_2_PLAN.md` jako DEPRECATED (zastąpiony przez sekcję 12)

## [0.1.1] - 2025-12-19

### Fixed
- Monday.com MCP: `MONDAY_ALLOWED_BOARD_ID` now properly filters results from list operations (like `get_boards`) to only show the allowed board, not just validate input parameters
- Added `filterMondayResult()` function to filter MCP response data after execution
- Board restriction can be easily disabled by setting `MONDAY_ALLOWED_BOARD_ID=` (empty) or removing it from `.env.local`

### Added
- Comprehensive security test suite for Monday.com MCP integration to verify all write operations are blocked before production deployment
- Unit tests for mutation operations blocking (`mutate_`, `insert_`, `post_`, `put_`, `patch_`)
- Unit tests for compound operations blocking (`move_item_to_group`, `change_multiple_column_values`, `bulk_*`, etc.)
- Unit tests for admin operations blocking (`invite_user`, `remove_user`, `change_permissions`, etc.)
- End-to-end security tests (`tests/monday-mcp-e2e-security.test.ts`) with real MCP server connection verification
  - Tests MCP server connection with `-ro` flag
  - Tests 20+ write operations blocking via `callMondayMCPTool()`
  - Tests direct MCP bypass attempts (blocked by MCP server)
  - Tests read operations functionality
  - Tests penetration attempts (SQL injection, path traversal, case variations)
- Production readiness check script (`scripts/test-monday-production-readiness.ts`)
  - Shows current configuration (token, -ro flag, board restrictions)
  - Runs all test suites automatically (unit, integration, E2E)
  - Tests write operations blocking with clear error messages
  - Generates detailed security report in Markdown format
  - Provides clear PASS/FAIL verdict for production readiness
- Security test results documentation (`docs/MONDAY_SECURITY_TEST_RESULTS.md`) with comprehensive test results

### Changed
- `integrations/mcp/monday.ts`: Changed `mondayMCPConfig` from static object to `getMondayMCPConfig()` function to ensure dynamic token loading from environment variables
- `integrations/mcp/init.ts`: Updated to use `getMondayMCPConfig()` for dynamic configuration
- `tests/monday-readonly.test.ts`: Extended with 3 new test categories (Test 11-13) covering mutation, compound, and admin operations

### Security
- Verified three-layer security protection:
  1. **MCP Server Level**: `-ro` flag blocks write operations at server level
  2. **Application Level**: `isReadOnlyTool()` check blocks write operations before execution
  3. **Tool Filtering**: `filterReadOnlyTools()` filters out write operations from available tools
- All write operations confirmed blocked (20+ operations tested):
  - Create operations: `create_item`, `create_board`, `create_column`, `create_update`
  - Update operations: `update_item`, `update_board`, `update_column`, `change_column_value`
  - Delete operations: `delete_item`, `delete_board`, `delete_column`, `delete_update`
  - Other operations: `archive_item`, `duplicate_item`, `move_item_to_group`, `mutate_item`, `insert_item`, `post_update`, `put_item`, `patch_item`
- Direct MCP bypass attempts blocked: Direct calls to `mcpManager.callTool()` with write operations are rejected by MCP server in `-ro` mode
- Penetration testing confirms no bypass methods work:
  - SQL injection patterns blocked
  - Path traversal patterns blocked
  - Case variation attempts blocked
  - Compound operation attempts blocked
- Production readiness verified: All security tests pass on test Monday.com account

### Added
- New test script `scripts/test-board-filtering.ts` for testing board filtering functionality
- Added "PoC Mode" indicator in navigation bar UI (`components/custom/navbar.tsx`)
- New npm script `test:board-filter` in package.json for board filtering tests

### Changed
- Enhanced `lib/monday-readonly.ts` with debug logging for security monitoring
- Updated `scripts/test-monday-security.ts` with improved test output formatting

## [0.1.0] - 2025-01-XX

### Changed
- Monday.com MCP integration: `MONDAY_ALLOWED_BOARD_ID` environment variable is now optional - when empty or not set, the integration allows unrestricted access to all boards accessible by the API token, instead of being limited to a single board
