# Monday.com Read-Only Client - Szybki Start

## 🎯 Co to jest?

Pakiet zabezpieczający dostęp do Monday.com przed przypadkowymi modyfikacjami danych. Wszystkie operacje zapisu są automatycznie blokowane.

## 📦 Zawartość pakietu

```
Monday_ReadOnly_Package/
├── monday_readonly_client.py       # Główny moduł (skopiuj do projektu)
├── README_MONDAY_READONLY.md       # Pełna dokumentacja
├── test_monday_readonly.py         # Testy jednostkowe
└── QUICKSTART.md                   # Ten plik
```

## ⚡ 3 kroki do uruchomienia

### 1️⃣ Skopiuj plik do projektu
```bash
cp monday_readonly_client.py /ścieżka/do/twojego/projektu/
```

### 2️⃣ Zainstaluj bibliotekę Monday.com
```bash
pip install monday
```

### 3️⃣ Użyj w kodzie
```python
from monday import MondayClient
from monday_readonly_client import safe_monday_call, ReadOnlyModeException

# Inicjalizacja klienta
client = MondayClient('TWÓJ_API_KEY')

# Bezpieczne odczytanie danych
try:
    boards = safe_monday_call(
        'mcp_monday-mcp_get_board_info',
        client.boards.fetch_boards_by_id,
        board_ids=[1234567890]
    )
    print(f"✅ Board: {boards[0]['name']}")
except ReadOnlyModeException as e:
    print(f"❌ Zablokowane: {e}")
```

## 🧪 Testowanie

### Szybki test modułu
```bash
python monday_readonly_client.py
```

Wynik powinien pokazać:
```
🧪 Testowanie walidacji operacji...

✅ get_board_info - DOZWOLONE
❌ create_item - ZABLOKOWANE
❌ unknown_operation - ZABLOKOWANE

✨ Testy zakończone!
```

### Pełne testy (wymaga pytest)
```bash
pip install pytest
python -m pytest test_monday_readonly.py -v
```

## 💡 Najczęstsze użycia

### Sprawdź czy operacja jest bezpieczna
```python
from monday_readonly_client import is_read_operation

if is_read_operation('mcp_monday-mcp_get_board_info'):
    print("✅ Bezpieczna operacja")
```

### Waliduj przed wywołaniem API
```python
from monday_readonly_client import validate_operation, ReadOnlyModeException

try:
    validate_operation('mcp_monday-mcp_create_item')  # To rzuci wyjątek
    # Twój kod...
except ReadOnlyModeException:
    print("❌ Ta operacja jest zablokowana")
```

### Sprawdź zapytanie GraphQL
```python
from monday_readonly_client import validate_graphql_query

query = """
query {
  boards { name }
}
"""
validate_graphql_query(query)  # OK - to query
```

## ✅ Co JEST dozwolone (przykłady)

```python
# ✅ Czytanie boardów
'mcp_monday-mcp_get_board_info'
'mcp_monday-mcp_get_board_items_page'

# ✅ Wyszukiwanie
'mcp_monday-mcp_search'
'mcp_monday-mcp_list_workspaces'

# ✅ Dane użytkowników
'mcp_monday-mcp_list_users_and_teams'
```

## ❌ Co NIE JEST dozwolone (przykłady)

```python
# ❌ Tworzenie/modyfikacja
'mcp_monday-mcp_create_item'
'mcp_monday-mcp_create_board'
'mcp_monday-mcp_change_item_column_values'

# ❌ Usuwanie
'mcp_monday-mcp_delete_item'
'mcp_monday-mcp_archive_item'

# ❌ Komentarze
'mcp_monday-mcp_create_update'
```

## 🔧 Dostosowanie

### Dodaj nową operację read-only

Otwórz `monday_readonly_client.py` i dodaj do sekcji `READ_ONLY_OPERATIONS`:

```python
READ_ONLY_OPERATIONS = {
    # ... istniejące ...
    'mcp_monday-mcp_twoja_nowa_operacja',  # Dodaj tutaj
}
```

## 📚 Więcej informacji

- **Pełna dokumentacja**: `README_MONDAY_READONLY.md`
- **Źródło**: Projekt TechSoup Impact Log
- **Licencja**: MIT (wolne do użytku)

## 🆘 Pomoc

### Czy mogę wyłączyć ochronę?
Nie. To celowa decyzja projektowa dla maksymalnego bezpieczeństwa.

### Co jeśli potrzebuję operacji write?
Używaj bezpośrednio biblioteki `monday` bez tego wrappera, ale **tylko w skryptach produkcyjnych z pełną dokumentacją**.

### Operacja którą potrzebuję jest zablokowana
Sprawdź czy to rzeczywiście operacja read-only. Jeśli tak, dodaj ją do `READ_ONLY_OPERATIONS`.

---

🎉 **Gotowe!** Teraz możesz bezpiecznie eksperymentować z Monday.com bez obaw o uszkodzenie danych.

