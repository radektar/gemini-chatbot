# 🛡️ Monday.com Read-Only Client Package

Samodzielny pakiet zabezpieczający dostęp do Monday.com API przed przypadkowymi modyfikacjami danych produkcyjnych.

## 🎯 Czym jest ten pakiet?

Wrapper dla Monday.com API, który:
- ✅ **Blokuje wszystkie operacje zapisu** (create, update, delete)
- ✅ **Pozwala na bezpieczne czytanie danych** (get, search, list)
- ✅ **Działa w trybie fail-safe** (nieznane operacje = zablokowane)
- ✅ **Nie wymaga konfiguracji** - bezpieczeństwo "out of the box"
- ✅ **Jest przenośny** - jeden plik Python bez zależności zewnętrznych

Idealny dla:
- 🧪 Eksperymentów z danymi produkcyjnymi
- 📊 Raportowania i analiz
- 🎓 Nauki Monday.com API
- 🔍 Debugowania bez ryzyka

## 📦 Zawartość pakietu

```
Monday_ReadOnly_Package/
├── README.md                       ← Ten plik (start tutaj!)
├── QUICKSTART.md                   ← 3-minutowy przewodnik
├── README_MONDAY_READONLY.md       ← Pełna dokumentacja
├── monday_readonly_client.py       ← Główny moduł (skopiuj do projektu)
├── example_usage.py                ← Przykłady użycia
├── test_monday_readonly.py         ← Testy jednostkowe
├── requirements.txt                ← Zależności
└── __init__.py                     ← Moduł Python
```

## ⚡ Szybki start (3 kroki)

### 1. Skopiuj główny moduł
```bash
cp monday_readonly_client.py /twoj/projekt/
```

### 2. Zainstaluj zależności
```bash
pip install monday
```

### 3. Użyj w kodzie
```python
from monday import MondayClient
from monday_readonly_client import safe_monday_call, ReadOnlyModeException

client = MondayClient('your_api_key')

# ✅ To zadziała (operacja read)
boards = safe_monday_call(
    'mcp_monday-mcp_get_board_info',
    client.boards.fetch_boards_by_id,
    board_ids=[123456]
)

# ❌ To zostanie zablokowane (operacja write)
try:
    result = safe_monday_call(
        'mcp_monday-mcp_create_item',
        client.items.create_item,
        board_id=123456,
        item_name="New Item"
    )
except ReadOnlyModeException as e:
    print(f"Zablokowane: {e}")
```

## 🚀 Demo

Uruchom przykładowy skrypt:

```bash
python example_usage.py
```

Lub podstawowy test:

```bash
python monday_readonly_client.py
```

## 📚 Dokumentacja

| Plik | Opis |
|------|------|
| **[QUICKSTART.md](QUICKSTART.md)** | Szybkie wprowadzenie (3 min) |
| **[README_MONDAY_READONLY.md](README_MONDAY_READONLY.md)** | Pełna dokumentacja z przykładami |
| **[example_usage.py](example_usage.py)** | Przykłady użycia z demo |

## 🔒 Model bezpieczeństwa

### Jak to działa?

1. **Whitelist operacji read** - jawna lista dozwolonych operacji
2. **Blacklist operacji write** - jawna lista zablokowanych operacji
3. **Fail-safe** - nieznane operacje blokowane domyślnie
4. **Brak override** - niemożliwe wyłączenie ochrony

### Co jest dozwolone?

✅ Wszystkie operacje READ:
- `get_board_info`, `get_board_items_page`
- `search`, `list_workspaces`
- `list_users_and_teams`
- i inne operacje odczytu

### Co jest zablokowane?

❌ Wszystkie operacje WRITE:
- `create_item`, `create_board`
- `change_item_column_values`
- `delete_item`, `archive_item`
- `create_update` (komentarze)
- i wszystkie inne modyfikacje

## 🧪 Testowanie

### Podstawowe testy
```bash
python monday_readonly_client.py
```

### Pełne testy (wymaga pytest)
```bash
pip install pytest
pytest test_monday_readonly.py -v
```

### Demo z prawdziwym API
```bash
export MONDAY_API_KEY="your_key_here"
python example_usage.py
```

## 💡 Przykłady użycia

### Sprawdź typ operacji
```python
from monday_readonly_client import is_read_operation, is_write_operation

if is_read_operation('mcp_monday-mcp_get_board_info'):
    print("✅ Bezpieczna operacja")
    
if is_write_operation('mcp_monday-mcp_create_item'):
    print("❌ Operacja zablokowana")
```

### Waliduj przed wywołaniem
```python
from monday_readonly_client import validate_operation, ReadOnlyModeException

try:
    validate_operation('mcp_monday-mcp_create_item')
    # Twój kod...
except ReadOnlyModeException as e:
    print(f"Zablokowane: {e}")
```

### Waliduj zapytania GraphQL
```python
from monday_readonly_client import validate_graphql_query

query = "query { boards { name } }"
validate_graphql_query(query)  # OK

mutation = "mutation { create_item(...) { id } }"
validate_graphql_query(mutation)  # Rzuci ReadOnlyModeException
```

## 🔧 Dostosowanie

### Dodaj nową operację read-only

Edytuj `monday_readonly_client.py`:

```python
READ_ONLY_OPERATIONS = {
    # ... istniejące operacje ...
    'mcp_monday-mcp_twoja_nowa_operacja',  # Dodaj tutaj
}
```

### Dodaj nową operację write do blacklisty

```python
BLOCKED_OPERATIONS = {
    # ... istniejące operacje ...
    'mcp_monday-mcp_nowa_operacja_write',  # Dodaj tutaj
}
```

## 🏗️ Integracja

### Flask API
```python
from flask import Flask, jsonify
from monday_readonly_client import safe_monday_call, ReadOnlyModeException

@app.route('/boards/<int:board_id>')
def get_board(board_id):
    try:
        board = safe_monday_call(
            'mcp_monday-mcp_get_board_info',
            client.boards.fetch_boards_by_id,
            board_ids=[board_id]
        )
        return jsonify(board)
    except ReadOnlyModeException as e:
        return jsonify({'error': str(e)}), 403
```

### Pandas DataFrame
```python
from monday_readonly_client import safe_monday_call

def get_board_as_dataframe(board_id):
    items = safe_monday_call(
        'mcp_monday-mcp_get_board_items_page',
        client.items.fetch_items_by_board_id,
        board_id=board_id
    )
    return pd.DataFrame(items)
```

## ❓ FAQ

### Q: Czy mogę wyłączyć ochronę?
**A**: Nie. To celowa decyzja projektowa dla maksymalnego bezpieczeństwa.

### Q: Co jeśli potrzebuję operacji write w produkcji?
**A**: Używaj bezpośrednio biblioteki `monday` bez wrappera, ale tylko w skryptach produkcyjnych z pełną dokumentacją.

### Q: Jak dodać nową operację read?
**A**: Dodaj ją do `READ_ONLY_OPERATIONS` w `monday_readonly_client.py`.

### Q: Czy mogę używać tego w komercyjnym projekcie?
**A**: Tak! Licencja MIT - wolne do użytku.

## 📄 Licencja

MIT License - możesz używać, modyfikować i dystrybuować ten kod w dowolnych projektach.

## 🤝 O projekcie

Ten pakiet został stworzony w ramach projektu **TechSoup Impact Log** jako zabezpieczenie przed przypadkowymi modyfikacjami danych w Monday.com podczas eksperymentów i analiz.

## 🆘 Wsparcie

1. Zobacz [QUICKSTART.md](QUICKSTART.md) dla podstaw
2. Przeczytaj [README_MONDAY_READONLY.md](README_MONDAY_READONLY.md) dla szczegółów
3. Uruchom `example_usage.py` dla praktycznych przykładów
4. Sprawdź kod w `monday_readonly_client.py` (dobrze udokumentowany)

---

## 🎯 Następne kroki

1. **Nowy użytkownik?** → Zacznij od [QUICKSTART.md](QUICKSTART.md)
2. **Potrzebujesz przykładów?** → Uruchom `python example_usage.py`
3. **Chcesz pełną dokumentację?** → Zobacz [README_MONDAY_READONLY.md](README_MONDAY_READONLY.md)
4. **Gotowy do użycia?** → Skopiuj `monday_readonly_client.py` do projektu

---

✨ **Gotowe do bezpiecznej pracy z Monday.com API!**

