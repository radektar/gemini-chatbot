# Monday.com Read-Only Client - Dokumentacja

## 📖 Wprowadzenie

Moduł `monday_readonly_client.py` zapewnia bezpieczny dostęp do Monday.com poprzez blokowanie wszystkich operacji zapisu. Jest to idealne rozwiązanie dla:

- 🧪 **Eksperymentów i testów** - bezpieczne testowanie bez ryzyka uszkodzenia danych
- 📊 **Raportowania** - czytanie danych bez możliwości ich modyfikacji
- 🔍 **Analiz** - eksploracja danych produkcyjnych bez obaw
- 🎓 **Szkoleń** - nauka API Monday.com w bezpiecznym środowisku

## 🚀 Instalacja

### Krok 1: Skopiuj plik
Skopiuj plik `monday_readonly_client.py` do swojego projektu.

### Krok 2: Zainstaluj zależności
```bash
pip install monday
```

### Krok 3: Zaimportuj w swoim kodzie
```python
from monday_readonly_client import (
    validate_operation,
    safe_monday_call,
    ReadOnlyModeException
)
```

## 📚 Użycie

### Podstawowe użycie z biblioteką `monday`

```python
from monday import MondayClient
from monday_readonly_client import safe_monday_call, ReadOnlyModeException

# Inicjalizacja klienta Monday.com
client = MondayClient('your_api_key_here')

try:
    # Bezpieczne odczytanie informacji o boardzie
    boards = safe_monday_call(
        'mcp_monday-mcp_get_board_info',
        client.boards.fetch_boards_by_id,
        board_ids=[1234567890]
    )
    print(f"Board: {boards[0]['name']}")
    
except ReadOnlyModeException as e:
    print(f"Operacja zablokowana: {e}")
```

### Walidacja przed wywołaniem

```python
from monday_readonly_client import validate_operation, ReadOnlyModeException

def my_monday_operation(operation_name, **kwargs):
    try:
        # Najpierw waliduj
        validate_operation(operation_name)
        
        # Jeśli przeszło - wykonaj operację
        return perform_monday_api_call(operation_name, **kwargs)
        
    except ReadOnlyModeException as e:
        print(f"Nie można wykonać operacji: {e}")
        return None
```

### Sprawdzanie typu operacji

```python
from monday_readonly_client import is_read_operation, is_write_operation

operation = 'mcp_monday-mcp_get_board_info'

if is_read_operation(operation):
    print("✅ To operacja read-only - można wykonać")
elif is_write_operation(operation):
    print("❌ To operacja write - zablokowana")
else:
    print("⚠️  Nieznana operacja - zostanie zablokowana")
```

### Walidacja zapytań GraphQL

```python
from monday_readonly_client import validate_graphql_query, ReadOnlyModeException

# Zapytanie read-only - OK
query_read = """
query {
  boards(ids: [123456]) {
    name
    items {
      name
    }
  }
}
"""

try:
    validate_graphql_query(query_read)
    print("✅ Zapytanie jest bezpieczne")
except ReadOnlyModeException as e:
    print(f"❌ Zapytanie zablokowane: {e}")

# Mutacja - ZABLOKOWANA
query_write = """
mutation {
  create_item(board_id: 123456, item_name: "New Item") {
    id
  }
}
"""

try:
    validate_graphql_query(query_write)  # To rzuci wyjątek
except ReadOnlyModeException as e:
    print(f"✅ Mutacja poprawnie zablokowana: {e}")
```

## 📋 Dozwolone operacje (Read-Only)

### Operacje na Boardach
- ✅ `mcp_monday-mcp_get_board_items_page` - Pobieranie itemów z boarda
- ✅ `mcp_monday-mcp_get_board_info` - Informacje o boardzie
- ✅ `mcp_monday-mcp_get_board_activity` - Historia aktywności
- ✅ `mcp_monday-mcp_board_insights` - Agregacje i statystyki

### Wyszukiwanie
- ✅ `mcp_monday-mcp_search` - Wyszukiwanie w Monday.com
- ✅ `mcp_monday-mcp_list_workspaces` - Lista workspace'ów
- ✅ `mcp_monday-mcp_workspace_info` - Informacje o workspace

### Inne
- ✅ `mcp_monday-mcp_list_users_and_teams` - Lista użytkowników i teamów
- ✅ `mcp_monday-mcp_read_docs` - Czytanie dokumentów
- ✅ `mcp_monday-mcp_get_form` - Informacje o formularzu
- ✅ `mcp_monday-mcp_get_graphql_schema` - Schema GraphQL

## ❌ Zablokowane operacje (Write)

### Operacje na Itemach
- ❌ `mcp_monday-mcp_create_item` - Tworzenie itemów
- ❌ `mcp_monday-mcp_change_item_column_values` - Modyfikacja wartości kolumn
- ❌ `mcp_monday-mcp_delete_item` - Usuwanie itemów
- ❌ `mcp_monday-mcp_archive_item` - Archiwizacja itemów

### Operacje na Boardach
- ❌ `mcp_monday-mcp_create_board` - Tworzenie boardów
- ❌ `mcp_monday-mcp_create_column` - Tworzenie kolumn
- ❌ `mcp_monday-mcp_create_group` - Tworzenie grup
- ❌ `mcp_monday-mcp_duplicate_board` - Duplikowanie boardów

### Komentarze i Aktualizacje
- ❌ `mcp_monday-mcp_create_update` - Dodawanie komentarzy

### Inne
- ❌ `mcp_monday-mcp_create_workspace` - Tworzenie workspace'ów
- ❌ `mcp_monday-mcp_create_doc` - Tworzenie dokumentów
- ❌ `mcp_monday-mcp_create_dashboard` - Tworzenie dashboardów

## 🔒 Model bezpieczeństwa

### 1. Brak możliwości wyłączenia
**WAŻNE**: Nie ma sposobu na wyłączenie trybu read-only:
- ❌ Brak zmiennych środowiskowych
- ❌ Brak flag konfiguracyjnych
- ❌ Brak argumentów wiersza poleceń

To zapewnia maksymalne bezpieczeństwo.

### 2. Fail-safe domyślnie
Nieznane operacje są **blokowane domyślnie**:
- Nowa nieznana operacja = automatycznie zablokowana
- Zapobiega przypadkowemu dopuszczeniu nowych operacji write
- Aby dodać nową operację read, należy ją explicite dodać do `READ_ONLY_OPERATIONS`

### 3. Logowanie
Wszystkie próby operacji są logowane:
- ✅ Dozwolone operacje → `INFO`
- ⚠️  Nieznane operacje → `WARNING`
- ❌ Zablokowane operacje → `ERROR`

## 🛠️ Dostosowanie do własnych potrzeb

### Dodawanie nowej operacji read-only

Jeśli potrzebujesz dodać nową operację read-only:

1. Otwórz `monday_readonly_client.py`
2. Znajdź `READ_ONLY_OPERATIONS`
3. Dodaj nazwę operacji:

```python
READ_ONLY_OPERATIONS = {
    # ... istniejące operacje ...
    'mcp_monday-mcp_twoja_nowa_operacja',
}
```

### Dodawanie operacji write do blacklisty

Jeśli odkryjesz nową operację write:

```python
BLOCKED_OPERATIONS = {
    # ... istniejące operacje ...
    'mcp_monday-mcp_nowa_operacja_write',
}
```

## 🧪 Testowanie

### Uruchomienie testów wbudowanych

```bash
python monday_readonly_client.py
```

### Własne testy

```python
from monday_readonly_client import (
    validate_operation,
    ReadOnlyModeException
)

def test_read_operations():
    """Test czy operacje read są dozwolone"""
    read_ops = [
        'mcp_monday-mcp_get_board_info',
        'mcp_monday-mcp_search',
        'mcp_monday-mcp_list_workspaces',
    ]
    
    for op in read_ops:
        try:
            validate_operation(op)
            print(f"✅ {op} - dozwolona")
        except ReadOnlyModeException:
            print(f"❌ {op} - zablokowana (błąd!)")

def test_write_operations():
    """Test czy operacje write są zablokowane"""
    write_ops = [
        'mcp_monday-mcp_create_item',
        'mcp_monday-mcp_create_board',
        'mcp_monday-mcp_delete_item',
    ]
    
    for op in write_ops:
        try:
            validate_operation(op)
            print(f"❌ {op} - dozwolona (błąd!)")
        except ReadOnlyModeException:
            print(f"✅ {op} - poprawnie zablokowana")

if __name__ == "__main__":
    test_read_operations()
    test_write_operations()
```

## 🔗 Przykłady integracji

### Integracja z Flask API

```python
from flask import Flask, jsonify
from monday import MondayClient
from monday_readonly_client import safe_monday_call, ReadOnlyModeException

app = Flask(__name__)
monday_client = MondayClient(API_KEY)

@app.route('/boards/<int:board_id>')
def get_board(board_id):
    try:
        board = safe_monday_call(
            'mcp_monday-mcp_get_board_info',
            monday_client.boards.fetch_boards_by_id,
            board_ids=[board_id]
        )
        return jsonify(board)
    except ReadOnlyModeException as e:
        return jsonify({'error': str(e)}), 403
```

### Integracja z pandas dla analizy danych

```python
import pandas as pd
from monday import MondayClient
from monday_readonly_client import safe_monday_call

client = MondayClient(API_KEY)

def get_board_as_dataframe(board_id):
    """Pobiera board jako DataFrame pandas"""
    items = safe_monday_call(
        'mcp_monday-mcp_get_board_items_page',
        client.items.fetch_items_by_board_id,
        board_id=board_id
    )
    
    # Konwersja do DataFrame
    df = pd.DataFrame(items)
    return df

# Użycie
df = get_board_as_dataframe(123456)
print(df.head())
print(df.describe())
```

## ❓ FAQ

### Pytanie: Co jeśli potrzebuję operacji write w produkcji?
**Odpowiedź**: Skrypty produkcyjne wymagające write powinny:
1. Być wyraźnie oddzielone od skryptów eksperymentalnych
2. Używać bezpośrednio klienta Monday.com (bez wrappera readonly)
3. Mieć dokładną dokumentację i testy
4. Wymagać zatwierdzenia przed wdrożeniem

### Pytanie: Czy mogę tymczasowo wyłączyć tryb read-only?
**Odpowiedź**: Nie. Tryb read-only jest na sztywno zakodowany bez mechanizmu wyłączenia.

### Pytanie: Co jeśli Monday.com doda nową operację?
**Odpowiedź**: Nowa operacja będzie domyślnie zablokowana. Jeśli jest read-only, dodaj ją do `READ_ONLY_OPERATIONS`.

## 📄 Licencja

MIT License - możesz używać tego kodu w dowolnych projektach.

## 🤝 Wsparcie

W razie pytań lub problemów:
1. Sprawdź sekcję FAQ
2. Zobacz przykłady w tym dokumencie
3. Przejrzyj kod w `monday_readonly_client.py`

## 📝 Historia zmian

- **v1.0** (2025-12-22) - Pierwsza wersja standalone
  - Podstawowa walidacja operacji
  - Walidacja zapytań GraphQL
  - Kompletna dokumentacja
  - Przykłady użycia

## 📦 Źródło

Ten moduł został stworzony w ramach projektu TechSoup Impact Log jako zabezpieczenie przed przypadkowymi modyfikacjami danych w Monday.com podczas eksperymentów i analiz.

