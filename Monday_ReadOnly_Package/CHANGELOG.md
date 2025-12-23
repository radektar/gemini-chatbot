# Changelog - Monday.com Read-Only Client

Wszystkie istotne zmiany w tym projekcie będą dokumentowane w tym pliku.

Format bazuje na [Keep a Changelog](https://keepachangelog.com/pl/1.0.0/),
a wersjonowanie zgodne z [Semantic Versioning](https://semver.org/lang/pl/).

## [1.0.0] - 2025-12-22

### ✨ Dodano
- Główny moduł `monday_readonly_client.py` z pełną funkcjonalnością read-only
- Klasa wyjątku `ReadOnlyModeException` dla zablokowanych operacji
- Funkcja `validate_operation()` dla walidacji operacji MCP
- Funkcja `validate_graphql_query()` dla walidacji zapytań GraphQL
- Funkcja `safe_monday_call()` dla bezpiecznych wywołań API
- Funkcje pomocnicze `is_read_operation()` i `is_write_operation()`
- Whitelist 16 dozwolonych operacji read
- Blacklist 19 zablokowanych operacji write
- Mechanizm fail-safe dla nieznanych operacji

### 📚 Dokumentacja
- `README.md` - główna dokumentacja (English)
- `CZYTAJ_MNIE.md` - instrukcja po polsku
- `QUICKSTART.md` - 3-minutowy przewodnik
- `README_MONDAY_READONLY.md` - pełna dokumentacja techniczna
- `INSTALL.md` - instrukcje instalacji (4 metody)
- `PACKAGE_INFO.md` - szczegóły pakietu
- `CHANGELOG.md` - historia zmian

### 🧪 Testy i przykłady
- `test_monday_readonly.py` - pełny zestaw testów jednostkowych (pytest)
- `example_usage.py` - demonstracja z 5 scenariuszami
- Wbudowane testy w głównym module (`python3 monday_readonly_client.py`)

### ⚙️ Konfiguracja
- `requirements.txt` - zależności Python
- `__init__.py` - inicjalizacja pakietu
- `.gitignore` - wykluczenia dla Git
- `LICENSE` - licencja MIT

### 🔒 Bezpieczeństwo
- Brak możliwości wyłączenia trybu read-only
- Walidacja przed każdym wywołaniem API
- Logowanie wszystkich prób operacji
- Domyślne blokowanie nieznanych operacji

### 📊 Statystyki
- ~2000 linii kodu i dokumentacji
- 350+ linii kodu głównego modułu
- 12+ testów jednostkowych
- 100% pokrycie dokumentacji
- 16 obsługiwanych operacji read
- 19 blokowanych operacji write

## [Planowane] - Przyszłość

### 🚀 Rozważane funkcjonalności
- [ ] Obsługa więcej operacji read z Monday.com API
- [ ] Opcjonalne logowanie do pliku
- [ ] Metryki i statystyki użycia
- [ ] Integracja z innymi bibliotekami (asyncio, aiohttp)
- [ ] Cache dla powtarzających się zapytań
- [ ] Rate limiting dla operacji read

### 📝 Dokumentacja
- [ ] Tutorial wideo
- [ ] Więcej przykładów integracji (Django, FastAPI)
- [ ] FAQ z rozszerzonymi odpowiedziami

### 🧪 Testy
- [ ] Testy integracyjne z prawdziwym API
- [ ] Testy wydajnościowe
- [ ] Przykłady z CI/CD

---

## Zasady wersjonowania

- **MAJOR** (X.0.0): Zmiany łamiące wsteczną kompatybilność
- **MINOR** (1.X.0): Nowe funkcjonalności zachowujące kompatybilność
- **PATCH** (1.0.X): Poprawki błędów

## Typy zmian

- **✨ Dodano**: Nowe funkcjonalności
- **🔄 Zmieniono**: Zmiany w istniejących funkcjonalnościach
- **🔧 Poprawiono**: Poprawki błędów
- **🗑️ Usunięto**: Usunięte funkcjonalności
- **🔒 Bezpieczeństwo**: Poprawki bezpieczeństwa
- **📚 Dokumentacja**: Zmiany w dokumentacji
- **🧪 Testy**: Zmiany w testach

---

**Źródło**: Projekt TechSoup Impact Log  
**Licencja**: MIT  
**Maintainer**: Impact Log Team

