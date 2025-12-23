# 📦 Monday.com Read-Only Client - Informacje o pakiecie

## 📊 Informacje podstawowe

- **Nazwa**: Monday.com Read-Only Client
- **Wersja**: 1.0.0
- **Data wydania**: 2025-12-22
- **Autor**: TechSoup Impact Log Project
- **Licencja**: MIT
- **Python**: 3.7+

## 📁 Zawartość pakietu (11 plików)

### 🔧 Pliki kodu
| Plik | Rozmiar | Opis |
|------|---------|------|
| `monday_readonly_client.py` | ~11 KB | Główny moduł - skopiuj do projektu |
| `__init__.py` | ~0.8 KB | Inicjalizacja pakietu Python |
| `example_usage.py` | ~6 KB | Przykłady użycia z demo |
| `test_monday_readonly.py` | ~4 KB | Testy jednostkowe (pytest) |

### 📚 Dokumentacja
| Plik | Opis |
|------|------|
| `README.md` | Główna dokumentacja - **START TUTAJ** |
| `QUICKSTART.md` | Szybki start (3 minuty) |
| `README_MONDAY_READONLY.md` | Pełna dokumentacja techniczna |
| `INSTALL.md` | Instrukcje instalacji (4 metody) |
| `PACKAGE_INFO.md` | Ten plik - informacje o pakiecie |

### ⚙️ Pliki konfiguracyjne
| Plik | Opis |
|------|------|
| `requirements.txt` | Zależności Python |
| `.gitignore` | Ignorowane pliki dla Git |
| `LICENSE` | Licencja MIT |

## 🎯 Co robi ten pakiet?

Zabezpiecza dostęp do Monday.com API przed przypadkowymi modyfikacjami:

- ✅ **Blokuje operacje write**: create, update, delete
- ✅ **Pozwala na operacje read**: get, search, list
- ✅ **Fail-safe**: nieznane operacje są blokowane
- ✅ **Zero konfiguracji**: działa "out of the box"

## 🚀 Szybki start dla nowych użytkowników

### 1. Przeczytaj dokumentację
```bash
cat README.md          # Główna dokumentacja
cat QUICKSTART.md      # 3-minutowy przewodnik
```

### 2. Przetestuj pakiet
```bash
python3 monday_readonly_client.py  # Podstawowy test
python3 example_usage.py           # Pełne demo
```

### 3. Zainstaluj w swoim projekcie
```bash
# Metoda najprostsza - skopiuj jeden plik
cp monday_readonly_client.py /twoj/projekt/

# Lub cały pakiet
cp -r Monday_ReadOnly_Package /twoj/projekt/
```

### 4. Użyj w kodzie
```python
from monday_readonly_client import safe_monday_call, ReadOnlyModeException
```

## 📦 Zalecane użycie według typu projektu

### 🧪 Eksperymenty / Jupyter Notebook
- Skopiuj: `monday_readonly_client.py`
- Dokumentacja: `QUICKSTART.md`

### 📊 Analizy danych / Raporty
- Skopiuj: `monday_readonly_client.py`
- Dokumentacja: `QUICKSTART.md` + `README_MONDAY_READONLY.md`

### 🏗️ Projekt produkcyjny
- Skopiuj: cały folder `Monday_ReadOnly_Package/`
- Dokumentacja: wszystkie pliki MD
- Testy: `test_monday_readonly.py`

### 🎓 Nauka / Szkolenie
- Skopiuj: cały folder
- Start: `example_usage.py` (uruchom i eksperymentuj)

## 🔍 Szczegóły techniczne

### Moduł główny (`monday_readonly_client.py`)

**Eksportowane funkcje:**
```python
validate_operation(operation_name: str) -> None
validate_graphql_query(query: str) -> None
is_read_operation(operation_name: str) -> bool
is_write_operation(operation_name: str) -> bool
safe_monday_call(operation_name: str, func, **kwargs) -> Any
```

**Eksportowane klasy:**
```python
ReadOnlyModeException(Exception)
```

**Eksportowane stałe:**
```python
READ_ONLY_OPERATIONS: Set[str]  # 16 operacji read
BLOCKED_OPERATIONS: Set[str]    # 19 operacji write
```

### Zależności

**Wymagane:**
- `monday` >= 1.3.0

**Opcjonalne:**
- `pytest` >= 7.0.0 (tylko dla testów)
- `pytest-cov` >= 4.0.0 (pokrycie testami)

## 📈 Statystyki

- **Linie kodu**: ~350 (główny moduł)
- **Testy**: 8 klas testowych, 12+ testów
- **Pokrycie dokumentacji**: 100%
- **Obsługiwane operacje read**: 16
- **Blokowane operacje write**: 19
- **Zależności**: 1 (monday)

## 🔒 Bezpieczeństwo

### Model ochrony
1. **Whitelist** - lista dozwolonych operacji read
2. **Blacklist** - lista zablokowanych operacji write
3. **Fail-safe** - nieznane = zablokowane
4. **Immutable** - brak możliwości wyłączenia ochrony

### Testowane scenariusze
- ✅ Operacje read przechodzą
- ✅ Operacje write blokowane
- ✅ Nieznane operacje blokowane
- ✅ GraphQL queries dozwolone
- ✅ GraphQL mutations blokowane

## 📞 Wsparcie

### Masz problem?
1. Zobacz **FAQ** w `README_MONDAY_READONLY.md`
2. Uruchom testy: `python3 monday_readonly_client.py`
3. Sprawdź przykłady: `python3 example_usage.py`

### Znalazłeś bug?
1. Sprawdź czy używasz Pythona 3.7+
2. Sprawdź czy masz zainstalowane `monday`
3. Uruchom testy: `pytest test_monday_readonly.py -v`

### Chcesz dodać funkcjonalność?
1. Przeczytaj sekcję "Dostosowanie" w `README_MONDAY_READONLY.md`
2. Edytuj `monday_readonly_client.py`
3. Dodaj testy w `test_monday_readonly.py`

## 🎯 Następne kroki

| Jesteś... | Przejdź do... |
|-----------|---------------|
| **Nowy użytkownik** | `README.md` → `QUICKSTART.md` |
| **Potrzebujesz przykładów** | `example_usage.py` (uruchom) |
| **Chcesz szczegółów** | `README_MONDAY_READONLY.md` |
| **Instalujesz pakiet** | `INSTALL.md` |
| **Developer** | `test_monday_readonly.py` |

## 🏆 Najlepsze praktyki

### ✅ DO (Zalecane)
- Używaj dla eksperymentów z danymi produkcyjnymi
- Używaj dla raportowania i analiz
- Skopiuj cały pakiet dla projektów produkcyjnych
- Uruchom testy przed pierwszym użyciem
- Czytaj logi - pokazują co zostało zablokowane

### ❌ DON'T (Niezalecane)
- Nie modyfikuj mechanizmu ochrony
- Nie dodawaj operacji write do whitelist
- Nie używaj dla skryptów produkcyjnych wymagających write
- Nie commituj kluczy API (sprawdź `.gitignore`)
- Nie pomijaj testów

## 📄 Licencja

**MIT License** - wolne do użytku w projektach komercyjnych i osobistych.

Pełna treść licencji: `LICENSE`

## 🙏 Podziękowania

Ten pakiet został stworzony w ramach projektu **TechSoup Impact Log** jako zabezpieczenie przed przypadkowymi modyfikacjami danych w Monday.com podczas eksperymentów i analiz.

---

**Wersja**: 1.0.0  
**Data**: 2025-12-22  
**Status**: Stabilny ✅

---

💡 **Wskazówka**: Jeśli to Twój pierwszy kontakt z tym pakietem, zacznij od `README.md`!

