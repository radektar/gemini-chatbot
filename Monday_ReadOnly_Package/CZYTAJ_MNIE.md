# 🛡️ Monday.com Read-Only Client - Instrukcja PL

## 🎯 Co to jest?

Pakiet, który **chroni przed przypadkowym zniszczeniem danych w Monday.com**.

Blokuje wszystkie operacje modyfikujące (tworzenie, edycja, usuwanie), ale pozwala na bezpieczne odczytywanie danych.

## ⚡ Jak użyć? (3 kroki)

### 1️⃣ Skopiuj plik do projektu
```bash
cp monday_readonly_client.py /ścieżka/do/twojego/projektu/
```

### 2️⃣ Zainstaluj bibliotekę Monday.com
```bash
pip install monday
```

### 3️⃣ Użyj w kodzie Python
```python
from monday import MondayClient
from monday_readonly_client import safe_monday_call, ReadOnlyModeException

# Twój klucz API
client = MondayClient('TWÓJ_KLUCZ_API')

# ✅ To zadziała (odczyt danych)
try:
    boards = safe_monday_call(
        'mcp_monday-mcp_get_board_info',
        client.boards.fetch_boards_by_id,
        board_ids=[1234567890]  # ID twojego boarda
    )
    print(f"Board: {boards[0]['name']}")
except ReadOnlyModeException as e:
    print(f"Zablokowane: {e}")

# ❌ To zostanie ZABLOKOWANE (próba modyfikacji)
try:
    new_item = safe_monday_call(
        'mcp_monday-mcp_create_item',
        client.items.create_item,
        board_id=1234567890,
        item_name="Nowy item"
    )
except ReadOnlyModeException as e:
    print(f"✅ Prawidłowo zablokowano próbę zapisu!")
```

## 🧪 Test działania

Uruchom w terminalu:
```bash
python3 monday_readonly_client.py
```

Powinno wyświetlić:
```
🧪 Testowanie walidacji operacji...
✅ get_board_info - DOZWOLONE
❌ create_item - ZABLOKOWANE
❌ unknown_operation - ZABLOKOWANE
✨ Testy zakończone!
```

## 📋 Co jest dozwolone?

✅ **Odczyt danych** (bezpieczne):
- Pobieranie informacji o boardach
- Wyszukiwanie itemów
- Lista użytkowników i zespołów
- Czytanie workspace'ów
- Wszystkie operacje typu "get", "list", "search"

## ❌ Co jest zablokowane?

❌ **Modyfikacja danych** (niebezpieczne):
- Tworzenie itemów
- Edycja wartości
- Usuwanie danych
- Tworzenie boardów
- Dodawanie komentarzy
- Wszystkie operacje typu "create", "update", "delete"

## 🔒 Czy można to wyłączyć?

**NIE.** To celowa decyzja - nie ma żadnego sposobu na wyłączenie ochrony. To zapewnia maksymalne bezpieczeństwo.

## 💡 Kiedy użyć?

### ✅ Użyj gdy:
- 🧪 Testujesz coś na danych produkcyjnych
- 📊 Tworzysz raporty i analizy
- 🎓 Uczysz się API Monday.com
- 🔍 Eksplorujesz dane bez ryzyka

### ❌ NIE używaj gdy:
- Potrzebujesz tworzyć/edytować dane (użyj normalnego API)
- Piszesz skrypt produkcyjny do modyfikacji danych

## 📚 Więcej informacji

| Potrzebujesz... | Zobacz plik... |
|-----------------|----------------|
| Szybkiego startu | `QUICKSTART.md` (English) |
| Pełnej dokumentacji | `README_MONDAY_READONLY.md` (English) |
| Instrukcji instalacji | `INSTALL.md` (English) |
| Przykładów kodu | `example_usage.py` (uruchom) |

## 🆘 Pomoc

### Problem: "ModuleNotFoundError"
```bash
# Zainstaluj bibliotekę Monday.com
pip install monday
```

### Problem: Nie działa import
```bash
# Upewnij się że plik jest w tym samym folderze
ls -la monday_readonly_client.py
```

### Problem: Chcę dodać nową operację read
Edytuj `monday_readonly_client.py`, znajdź sekcję `READ_ONLY_OPERATIONS` i dodaj:
```python
READ_ONLY_OPERATIONS = {
    # ... istniejące operacje ...
    'mcp_monday-mcp_twoja_nowa_operacja',  # Dodaj tutaj
}
```

## 🎯 Przykłady zastosowań

### 1. Raport z Monday.com
```python
from monday_readonly_client import safe_monday_call
import pandas as pd

# Pobierz dane
items = safe_monday_call(
    'mcp_monday-mcp_get_board_items_page',
    client.items.fetch_items_by_board_id,
    board_id=123456
)

# Analiza w pandas
df = pd.DataFrame(items)
print(df.describe())
```

### 2. Sprawdzanie przed wywołaniem
```python
from monday_readonly_client import is_read_operation

operation = 'mcp_monday-mcp_get_board_info'

if is_read_operation(operation):
    print("✅ Bezpieczna operacja - można wykonać")
else:
    print("❌ Operacja niebezpieczna - zablokowana")
```

### 3. Walidacja operacji
```python
from monday_readonly_client import validate_operation, ReadOnlyModeException

try:
    validate_operation('mcp_monday-mcp_create_item')
    print("Operacja dozwolona")
except ReadOnlyModeException:
    print("❌ Ta operacja jest zablokowana")
```

## 📦 Zawartość pakietu

```
Monday_ReadOnly_Package/
├── monday_readonly_client.py      ← GŁÓWNY PLIK (skopiuj do projektu)
├── README.md                      ← Dokumentacja główna (English)
├── CZYTAJ_MNIE.md                 ← Ten plik (Polski)
├── QUICKSTART.md                  ← Szybki start
├── example_usage.py               ← Przykłady użycia
├── test_monday_readonly.py        ← Testy
└── requirements.txt               ← Zależności
```

## ✅ Gotowe!

Teraz możesz bezpiecznie eksperymentować z Monday.com bez obaw o zniszczenie danych! 🎉

---

**Pytania?** Zobacz pełną dokumentację w plikach `.md` lub uruchom `example_usage.py` dla demo.

**Licencja:** MIT - wolne do użytku w dowolnych projektach.

**Źródło:** Projekt TechSoup Impact Log

