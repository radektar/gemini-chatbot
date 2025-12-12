# Specyfikacja Projektu: Gemini + Monday Chatbot

## 1. Przegląd projektu

Chatbot oparty na Next.js wykorzystujący Google Gemini AI do interakcji z użytkownikami oraz integrację z Monday.com przez Model Context Protocol (MCP) do odczytu danych z tablic projektowych.

## 2. Pełny zakres funkcjonalny (docelowy)

### 2.1 Integracje

#### Google Gemini AI
- **Model**: `gemini-2.5-pro`
- **Funkcjonalność**: 
  - Generowanie odpowiedzi w języku polskim
  - Obsługa narzędzi (tools) dla integracji zewnętrznych
  - Streaming odpowiedzi

#### Monday.com (MCP)
- **Tryb**: Read-only (tylko odczyt)
- **Zabezpieczenia**:
  - Flaga `-ro` na poziomie MCP servera
  - Whitelist/blacklist narzędzi
  - Ograniczenie do wybranego board ID
- **Dostępne operacje**:
  - Przeglądanie tablic (boards)
  - Przeglądanie zadań (items)
  - Przeglądanie kolumn i grup
  - Wyszukiwanie danych

#### Slack
- **Funkcjonalność**:
  - Przeszukiwanie historii kanałów
  - Pobieranie wiadomości z kanałów
  - Integracja z historią rozmów zespołu

#### Autoryzacja (Google OAuth)
- **Status**: ✅ **Już zbudowane w kodzie** (wyłączone w PoC)
- **Mechanizm**: NextAuth.js z Google Provider
- **Funkcjonalność**:
  - Logowanie przez Google
  - Opcjonalne ograniczenie do domeny Google Workspace
  - Sesje użytkowników
- **Przywrócenie**: Zobacz sekcję 8.2 - wymaga tylko konfiguracji Google Cloud Console i zmiennych środowiskowych

#### Baza danych (PostgreSQL)
- **Funkcjonalność**:
  - Przechowywanie użytkowników
  - Historia czatów
  - Persystencja danych między sesjami

### 2.2 Funkcje dodatkowe

- **Pogoda**: Narzędzie do pobierania aktualnej pogody
- **Historia czatów**: Zapisywanie i przeglądanie poprzednich rozmów
- **Tematy**: Obsługa dark/light mode
- **Multimodal input**: Obsługa załączników w wiadomościach

## 3. Ograniczony zakres PoC

### 3.1 Co jest włączone

- ✅ **Gemini AI** - pełna funkcjonalność
- ✅ **Monday.com MCP** - read-only, ograniczony do board ID `5088645756` (konto testowe)
- ✅ **Pogoda** - narzędzie getWeather
- ✅ **Podstawowy UI** - interfejs czatu

### 3.2 Co jest wyłączone

- ❌ **Google OAuth** - brak autoryzacji (dostęp otwarty)
- ❌ **PostgreSQL** - brak persystencji (historia tylko w sesji przeglądarki)
- ❌ **Slack** - integracja wyłączona
- ❌ **Zapisywanie historii** - brak zapisu do bazy danych

### 3.3 Ograniczenia PoC

- Historia czatów dostępna tylko w bieżącej sesji przeglądarki
- Brak autoryzacji - każdy może używać aplikacji
- Monday.com ograniczony do jednego boardu (ID: `5088645756` - konto testowe)
- Brak możliwości zarządzania użytkownikami

## 4. Architektura techniczna

### 4.1 Stack technologiczny

- **Framework**: Next.js 15 (App Router)
- **AI SDK**: Vercel AI SDK v3.4.9
- **Model AI**: Google Gemini 2.5 Pro
- **MCP**: @modelcontextprotocol/sdk v1.24.3
- **Styling**: Tailwind CSS + shadcn/ui
- **TypeScript**: v5

### 4.2 Struktura projektu

```
gemini-chatbot/
├── app/
│   ├── (auth)/          # Strony autoryzacji (wyłączone w PoC)
│   └── (chat)/          # Główna aplikacja czatu
│       ├── api/chat/    # API endpoint dla czatu
│       └── page.tsx      # Strona główna
├── components/
│   ├── custom/          # Komponenty aplikacji
│   └── ui/              # Komponenty UI (shadcn)
├── integrations/
│   └── mcp/             # Integracja Monday.com MCP
├── db/                  # Schemat i zapytania DB (zmockowane w PoC)
├── ai/                  # Konfiguracja modeli AI
└── docs/                # Dokumentacja
```

### 4.3 Przepływ danych

```
Użytkownik → Next.js API Route → Gemini AI
                              ↓
                         Monday.com MCP (read-only)
                              ↓
                         Odpowiedź → Użytkownik
```

## 5. Zabezpieczenia Monday.com

### 5.1 Trzy warstwy ochrony

| Warstwa | Mechanizm | Lokalizacja |
|---------|-----------|-------------|
| **1** | Flaga `-ro` MCP servera | `integrations/mcp/monday.ts` |
| **2** | Whitelist/blacklist narzędzi | `integrations/mcp/monday-readonly.ts` |
| **3** | Filtr board_id | `integrations/mcp/init.ts` |

### 5.2 Szczegóły implementacji

#### Warstwa 1: Read-Only Flag
```typescript
args: [
  "@mondaydotcomorg/monday-api-mcp@latest",
  "-t", process.env.MONDAY_API_TOKEN,
  "-ro"  // Read-only mode
]
```

#### Warstwa 2: Tool Filtering
- Whitelist: `get_boards`, `get_items`, `get_board`, etc.
- Blacklist: `create`, `update`, `delete`, `modify`, etc.

#### Warstwa 3: Board ID Validation
- Sprawdzanie `board_id` przed wykonaniem wywołania
- Blokowanie dostępu do innych boardów
- Logowanie wszystkich wywołań MCP

## 6. Konfiguracja i uruchomienie

### 6.1 Wymagane zmienne środowiskowe

Utwórz plik `.env.local` w głównym katalogu projektu:

```bash
# Gemini AI (WYMAGANE)
GOOGLE_GENERATIVE_AI_API_KEY=twój_klucz_gemini

# Monday.com (WYMAGANE)
MONDAY_API_TOKEN=twój_token_monday
MONDAY_ALLOWED_BOARD_ID=5088645756

# NextAuth (WYMAGANE - nawet w PoC)
AUTH_SECRET=dowolny_tekst_min_32_znaki

# PostgreSQL (NIE WYMAGANE w PoC)
# POSTGRES_URL=postgresql://...

# Google OAuth (NIE WYMAGANE w PoC)
# GOOGLE_CLIENT_ID=...
# GOOGLE_CLIENT_SECRET=...
```

### 6.2 Instalacja zależności

```bash
pnpm install
```

### 6.3 Uruchomienie PoC

```bash
pnpm dev
```

Aplikacja będzie dostępna pod adresem: **http://localhost:3000**

### 6.4 Migracje bazy danych (tylko dla pełnej wersji)

```bash
npx tsx db/migrate
```

**Uwaga**: W PoC migracje nie są wymagane, ponieważ baza danych jest zmockowana.

## 7. Instrukcja konfiguracji Monday.com

### 7.1 Uzyskanie API Token

1. Zaloguj się do Monday.com
2. Kliknij avatar w lewym dolnym rogu
3. Wybierz **Developers**
4. Przejdź do **My Access Tokens**
5. Kliknij **Show** i skopiuj token

### 7.2 Ograniczenie do boardu

W PoC dostęp jest ograniczony do boardu o ID `5088645756` (konto testowe: `radoslawtaraszkas-team`). 

**Konfiguracja testowa**:
- Używamy **osobnego konta Monday.com** z dostępem tylko do jednego boardu
- To zapewnia maksymalne bezpieczeństwo - token fizycznie nie ma dostępu do innych boardów
- Board URL: `https://radoslawtaraszkas-team.monday.com/boards/5088645756`

Aby zmienić board:
1. Otwórz board w Monday.com
2. Skopiuj ID z URL: `https://monday.com/boards/{BOARD_ID}`
3. Ustaw zmienną `MONDAY_ALLOWED_BOARD_ID` w `.env.local`

### 7.3 Bezpieczeństwo tokenu

**PoC używa 4 warstw ochrony**:
1. **Osobne konto Monday** - token z konta z dostępem tylko do 1 boardu
2. **Flaga `-ro`** - read-only mode na poziomie MCP servera
3. **Whitelist/blacklist** - filtrowanie narzędzi w kodzie
4. **Board ID filter** - walidacja board_id przed każdym wywołaniem

- Token ma takie same uprawnienia jak konto użytkownika
- W PoC używamy osobnego konta testowego dla maksymalnego bezpieczeństwa

## 8. Przejście z PoC do pełnej wersji

### 8.1 Krok 1: Przywrócenie PostgreSQL

1. Skonfiguruj bazę danych PostgreSQL (lokalnie lub cloud)
2. Ustaw `POSTGRES_URL` w `.env.local`
3. Przywróć oryginalny kod w `db/queries.ts`
4. Uruchom migracje: `npx tsx db/migrate`

### 8.2 Krok 2: Przywrócenie Google OAuth

**Status**: OAuth jest już zbudowane w kodzie, tylko wyłączone w PoC.

#### 8.2.1 Konfiguracja Google Cloud Console

1. **Utwórz projekt**:
   - Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
   - Kliknij **Select a project** → **New Project**
   - Wprowadź nazwę projektu (np. "gemini-chatbot")
   - Kliknij **Create**

2. **Włącz Google+ API**:
   - W menu po lewej: **APIs & Services** → **Library**
   - Wyszukaj "Google+ API" lub "Google Identity"
   - Kliknij **Enable**

3. **Utwórz OAuth 2.0 credentials**:
   - Przejdź do **APIs & Services** → **Credentials**
   - Kliknij **Create Credentials** → **OAuth client ID**
   - Jeśli pierwszy raz: skonfiguruj **OAuth consent screen**:
     - Wybierz **External** (lub Internal dla Google Workspace)
     - Wypełnij wymagane pola (App name, User support email)
     - Kliknij **Save and Continue** przez wszystkie kroki
   - W **Application type** wybierz **Web application**
   - Wprowadź nazwę (np. "Gemini Chatbot")
   - **Authorized redirect URIs**: Dodaj:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
     (Dla produkcji dodaj również URL produkcyjny)
   - Kliknij **Create**
   - **Skopiuj Client ID i Client Secret**

4. **Opcjonalnie: Ograniczenie do domeny Google Workspace**:
   - Jeśli chcesz ograniczyć logowanie tylko do swojej domeny:
     - Dodaj zmienną `GOOGLE_WORKSPACE_DOMAIN=twoja-domena.com` do `.env.local`
     - Kod automatycznie zweryfikuje domenę emaila

#### 8.2.2 Konfiguracja zmiennych środowiskowych

Dodaj do `.env.local`:
```bash
GOOGLE_CLIENT_ID=twój_client_id_z_google_cloud
GOOGLE_CLIENT_SECRET=twój_client_secret_z_google_cloud
AUTH_SECRET=wygeneruj_przez_openssl_rand_-base64_32
# Opcjonalnie:
GOOGLE_WORKSPACE_DOMAIN=twoja-domena.com
```

**Wygeneruj AUTH_SECRET**:
```bash
openssl rand -base64 32
```

#### 8.2.3 Przywrócenie kodu autoryzacji

1. **Przywróć middleware** (`middleware.ts`):
```typescript
import NextAuth from "next-auth";
import { authConfig } from "@/app/(auth)/auth.config";

export default NextAuth(authConfig).auth;

export const config = {
  matcher: ["/", "/:id", "/api/:path*", "/login", "/register"],
};
```

2. **Przywróć auth w API** (`app/(chat)/api/chat/route.ts`):
   - Odkomentuj `import { auth } from "@/app/(auth)/auth";`
   - Odkomentuj sprawdzanie sesji:
   ```typescript
   const session = await auth();
   if (!session) {
     return new Response("Unauthorized", { status: 401 });
   }
   ```

3. **Przywróć auth w innych plikach**:
   - `app/(chat)/api/history/route.ts`
   - `app/(chat)/chat/[id]/page.tsx`
   - `app/(chat)/api/files/upload/route.ts`
   - `components/custom/navbar.tsx`

4. **Przywróć zapis do bazy** w `onFinish` callback w `route.ts`

#### 8.2.4 Testowanie OAuth

1. Uruchom aplikację: `pnpm dev`
2. Przejdź do `http://localhost:3000`
3. Powinieneś zostać przekierowany do `/login`
4. Kliknij **Sign in with Google**
5. Zaloguj się kontem Google
6. Po zalogowaniu powinieneś zostać przekierowany do głównej strony czatu

#### 8.2.5 Rozwiązywanie problemów OAuth

**Błąd: "redirect_uri_mismatch"**:
- Sprawdź czy redirect URI w Google Cloud Console dokładnie pasuje do: `http://localhost:3000/api/auth/callback/google`
- Upewnij się że nie ma dodatkowych slashy lub różnic w protokole

**Błąd: "invalid_client"**:
- Sprawdź czy `GOOGLE_CLIENT_ID` i `GOOGLE_CLIENT_SECRET` są poprawnie skopiowane
- Upewnij się że nie ma dodatkowych spacji w `.env.local`

**Błąd: "access_denied"**:
- Sprawdź czy OAuth consent screen jest skonfigurowany
- Upewnij się że aplikacja jest w trybie "Testing" lub "Production"

### 8.3 Krok 3: Włączenie Slack

1. Utwórz Slack App w https://api.slack.com/apps
2. Uzyskaj Bot Token
3. Ustaw `SLACK_BOT_TOKEN` w `.env.local`
4. Integracja Slack jest już zaimplementowana w kodzie

## 9. Rozwiązywanie problemów

### 9.1 Monday.com MCP nie łączy się

- Sprawdź czy `MONDAY_API_TOKEN` jest poprawnie ustawiony
- Sprawdź czy token jest aktywny w Monday.com
- Sprawdź logi konsoli serwera

### 9.2 Gemini AI nie odpowiada

- Sprawdź czy `GOOGLE_GENERATIVE_AI_API_KEY` jest poprawny
- Sprawdź limity API w Google Cloud Console
- Sprawdź logi błędów w konsoli

### 9.3 Błędy związane z bazą danych

- W PoC baza jest zmockowana - błędy nie powinny występować
- Jeśli widzisz błędy, sprawdź czy nie próbujesz używać pełnej wersji

## 10. Dokumentacja dodatkowa

- [Monday.com MCP Setup](./MONDAY_MCP_SETUP.md)
- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/docs)
- [Monday.com API](https://developer.monday.com/api-reference/docs)

