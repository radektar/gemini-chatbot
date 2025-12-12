# Monday.com MCP Setup Guide

## Krok 1: Uzyskaj Monday.com API Token

1. Zaloguj się do Monday.com
2. Kliknij na swój avatar (lewy dolny róg)
3. Wybierz **"Developers"**
4. Kliknij **"My access tokens"** w menu po lewej
5. Kliknij **"Generate new token"** lub skopiuj istniejący token
6. **Skopiuj token** (zaczyna się od `eyJhbG...`)

> **Rekomendacja bezpieczeństwa**: Użyj tokenu z konta użytkownika z rolą **"Viewer"** dla maksymalnego bezpieczeństwa (read-only na poziomie API).

## Krok 2: Skonfiguruj zmienną środowiskową

1. Otwórz plik `.env` w głównym katalogu projektu
2. Dodaj lub zaktualizuj:

```env
MONDAY_API_TOKEN=eyJhbGciOiJIUzI1NiJ9.eyJ0aWQiOjEyMzQ1Njc4LCJ1aWQiOjEyMzQ1Njc4fQ.xxxxxxxxxxxxx
```

3. Zastąp `eyJhbG...` swoim rzeczywistym tokenem

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

## Rozwiązywanie problemów

### Problem: "MONDAY_API_TOKEN not set"
**Rozwiązanie**: Sprawdź czy token jest w pliku `.env` i czy plik jest w głównym katalogu projektu

### Problem: "Failed to initialize MCP servers"
**Rozwiązanie**: 
- Sprawdź czy token jest poprawny
- Sprawdź czy masz dostęp do internetu (npx pobiera pakiet)
- Sprawdź logi w konsoli dla szczegółów błędu

### Problem: "Blocked write operation"
**Rozwiązanie**: To jest normalne - operacje write są blokowane w trybie read-only. Użyj tylko operacji odczytu.

## Bezpieczeństwo

- ✅ **Read-only mode**: Tylko operacje odczytu są dozwolone
- ✅ **Filtrowanie narzędzi**: Automatyczne filtrowanie write operations
- ✅ **Walidacja przed wykonaniem**: Każde narzędzie jest sprawdzane przed wywołaniem
- ✅ **Rekomendacja**: Użyj tokenu z konta Viewer dla dodatkowej ochrony

## Więcej informacji

- [Monday.com MCP Documentation](https://support.monday.com/hc/en-us/articles/28588158981266-Get-started-with-monday-MCP)
- [Monday.com API Reference](https://developer.monday.com/api-reference/docs)





