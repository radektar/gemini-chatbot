# Monday.com MCP Setup Guide

## ⚠️ Wymagania wersji Node.js

**WAŻNE**: Monday.com MCP wymaga **Node.js 20-23.x**. Node.js 24+ NIE jest wspierane z powodu problemów z kompilacją natywnych modułów (`isolated-vm`).

### Sprawdź wersję Node.js:
```bash
node --version
```

### Jeśli masz Node.js 24+:

**macOS (Homebrew):**
```bash
# Zainstaluj Node.js 22 LTS
brew install node@22

# Opcja A: Użyj globalnie (zmień domyślną wersję)
brew unlink node
brew link node@22 --force

# Opcja B: Projekt automatycznie używa Node.js 22 dla MCP
# (skonfigurowane w integrations/mcp/monday.ts)
```

**Linux/Windows:**
```bash
# Użyj nvm (Node Version Manager)
nvm install 22
nvm use 22
```

---

## Krok 1: Uzyskaj Monday.com API Token

1. Zaloguj się do Monday.com
2. Kliknij na swój avatar (lewy dolny róg)
3. Wybierz **"Developers"**
4. Kliknij **"My access tokens"** w menu po lewej
5. Kliknij **"Generate new token"** lub skopiuj istniejący token
6. **Skopiuj token** (zaczyna się od `eyJhbG...`)

> **Rekomendacja bezpieczeństwa**: Użyj tokenu z konta użytkownika z rolą **"Viewer"** dla maksymalnego bezpieczeństwa (read-only na poziomie API).

## Krok 2: Skonfiguruj zmienną środowiskową

1. Otwórz plik `.env.local` w głównym katalogu projektu
2. Dodaj lub zaktualizuj:

```env
MONDAY_API_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEyMzQ1Njc4LCJ1aWQiOjEyMzQ1Njc4fQ.xxxxxxxxxxxxx

# OPCJONALNE: Ograniczenie dostępu do jednej tablicy (dla testów/PoC)
# Zostaw puste lub usuń aby mieć dostęp do wszystkich tablic
MONDAY_ALLOWED_BOARD_ID=5088644227
```

3. Zastąp `eyJhbG...` swoim rzeczywistym tokenem
4. Opcjonalnie: Ustaw `MONDAY_ALLOWED_BOARD_ID` aby ograniczyć dostęp do konkretnej tablicy

## Krok 3: Uruchom aplikację

```bash
npm run dev
```

## Krok 4: Przetestuj połączenie

1. Otwórz aplikację w przeglądarce: `http://localhost:3000`
2. Zaloguj się (Google Workspace)
3. W czacie napisz:
   - "Pokaż moje tablice w Monday.com"
   - "Jakie mam zadania?"
   - "Pokaż szczegóły zadania X"

## Jak to działa?

1. **Automatyczna inicjalizacja**: Przy pierwszym wywołaniu narzędzi Monday.com, serwer MCP uruchamia się automatycznie
2. **Używa oficjalnego pakietu**: `@mondaydotcomorg/monday-api-mcp@latest` przez `npx`
3. **Read-only mode**: Tylko operacje odczytu są dozwolone (zabezpieczenie w kodzie)
4. **Filtrowanie narzędzi**: Automatycznie filtruje tylko read-only narzędzia z serwera MCP

## Sprawdzanie logów

W konsoli zobaczysz:
```
Monday.com MCP server connected (READ-ONLY MODE)
[Monday.com MCP] Loaded 15 read-only tools out of 25 total tools
```

## Ograniczenie dostępu do konkretnej tablicy

### Jak włączyć ograniczenie:

1. Otwórz tablicę w Monday.com
2. Skopiuj ID z URL: `https://yourworkspace.monday.com/boards/5088644227`
3. Ustaw w `.env.local`:
   ```env
   MONDAY_ALLOWED_BOARD_ID=5088644227
   ```
4. Zrestartuj aplikację (`npm run dev`)

### Jak wyłączyć ograniczenie (dostęp do wszystkich tablic):

**Opcja 1:** Zostaw pustą wartość
```env
MONDAY_ALLOWED_BOARD_ID=
```

**Opcja 2:** Usuń całą linię z `.env.local`

**Opcja 3:** Zakomentuj linię
```env
# MONDAY_ALLOWED_BOARD_ID=5088644227
```

Po wyłączeniu, chatbot będzie miał dostęp do **wszystkich tablic** dostępnych przez API token.

## Rozwiązywanie problemów

### Problem: "MONDAY_API_TOKEN not set"
**Rozwiązanie**: Sprawdź czy token jest w pliku `.env.local` i czy plik jest w głównym katalogu projektu

### Problem: "Failed to initialize MCP servers" / "Connection closed" (MCP error -32000)
**Rozwiązanie**: 
1. **Sprawdź wersję Node.js** - najczęstsza przyczyna!
   ```bash
   node --version
   ```
   - Jeśli masz Node.js 24+, zainstaluj Node.js 22 LTS (zobacz sekcję "Wymagania wersji Node.js" na górze)
   
2. Sprawdź czy token jest poprawny:
   ```bash
   curl -X POST https://api.monday.com/v2 \
     -H "Content-Type: application/json" \
     -H "Authorization: $MONDAY_API_TOKEN" \
     -d '{"query": "{ me { name } }"}'
   ```
   
3. Sprawdź czy masz dostęp do internetu (npx pobiera pakiet)
4. Sprawdź logi w konsoli dla szczegółów błędu

### Problem: "gyp ERR! build error" / "error: unknown type name 'concept'"
**Rozwiązanie**: To jest błąd kompilacji natywnych modułów na Node.js 24+. Zainstaluj Node.js 22 LTS:
```bash
# macOS
brew install node@22

# Projekt automatycznie użyje Node.js 22 dla MCP
```

### Problem: "Blocked write operation"
**Rozwiązanie**: To jest normalne - operacje write są blokowane w trybie read-only. Użyj tylko operacji odczytu.

### Problem: "Access denied: This PoC is restricted to board ID..."
**Rozwiązanie**: To oznacza, że `MONDAY_ALLOWED_BOARD_ID` jest ustawione i próbujesz uzyskać dostęp do innej tablicy. Aby wyłączyć ograniczenie, zobacz sekcję "Jak wyłączyć ograniczenie" powyżej.

## Bezpieczeństwo

- ✅ **Read-only mode**: Tylko operacje odczytu są dozwolone
- ✅ **Filtrowanie narzędzi**: Automatyczne filtrowanie write operations
- ✅ **Walidacja przed wykonaniem**: Każde narzędzie jest sprawdzane przed wywołaniem
- ✅ **Rekomendacja**: Użyj tokenu z konta Viewer dla dodatkowej ochrony

## Więcej informacji

- [Monday.com MCP Documentation](https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP)
- [Monday.com API Reference](https://developer.monday.com/api-reference/docs)





