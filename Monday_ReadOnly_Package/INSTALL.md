# 📦 Instrukcja instalacji Monday.com Read-Only Client

## 🎯 Metoda 1: Kopiowanie pojedynczego pliku (najprostsza)

### Do małych projektów lub szybkich eksperymentów

```bash
# 1. Skopiuj główny moduł do swojego projektu
cp monday_readonly_client.py /ścieżka/do/twojego/projektu/

# 2. Zainstaluj zależności
pip install monday

# 3. Gotowe! Użyj w kodzie
```

```python
from monday_readonly_client import safe_monday_call, ReadOnlyModeException
```

---

## 🎯 Metoda 2: Kopiowanie całego pakietu

### Do większych projektów wymagających testów i dokumentacji

```bash
# 1. Skopiuj cały folder
cp -r Monday_ReadOnly_Package /ścieżka/do/twojego/projektu/

# 2. Zainstaluj zależności
cd /ścieżka/do/twojego/projektu/Monday_ReadOnly_Package
pip install -r requirements.txt

# 3. Przetestuj
python3 monday_readonly_client.py
python3 example_usage.py

# 4. Użyj w swoim projekcie
```

```python
from Monday_ReadOnly_Package.monday_readonly_client import safe_monday_call
```

---

## 🎯 Metoda 3: Jako moduł Python

### Do projektów z własną strukturą modułów

```bash
# 1. Skopiuj cały folder do src/lib
mkdir -p /twoj_projekt/src/lib
cp -r Monday_ReadOnly_Package /twoj_projekt/src/lib/

# 2. Dodaj do PYTHONPATH (opcjonalnie)
export PYTHONPATH="${PYTHONPATH}:/twoj_projekt/src/lib"

# 3. Import
```

```python
from lib.Monday_ReadOnly_Package import safe_monday_call, ReadOnlyModeException
```

---

## 🎯 Metoda 4: Integracja bezpośrednia w kodzie

### Jeśli nie chcesz zewnętrznych zależności

Skopiuj funkcje `validate_operation()` i listy `READ_ONLY_OPERATIONS`, `BLOCKED_OPERATIONS` bezpośrednio do swojego kodu:

```python
# W twoim pliku main.py
class ReadOnlyModeException(Exception):
    def __init__(self, operation_name: str):
        message = f"❌ Operacja '{operation_name}' zablokowana"
        super().__init__(message)

READ_ONLY_OPERATIONS = {
    'mcp_monday-mcp_get_board_info',
    'mcp_monday-mcp_get_board_items_page',
    # ... pozostałe
}

BLOCKED_OPERATIONS = {
    'mcp_monday-mcp_create_item',
    'mcp_monday-mcp_create_board',
    # ... pozostałe
}

def validate_operation(operation_name: str) -> None:
    if operation_name in BLOCKED_OPERATIONS:
        raise ReadOnlyModeException(operation_name)
    if operation_name not in READ_ONLY_OPERATIONS:
        raise ReadOnlyModeException(operation_name)

# Użycie
validate_operation('mcp_monday-mcp_get_board_info')  # OK
```

---

## 🧪 Weryfikacja instalacji

### Test 1: Podstawowy import
```python
python3 -c "from monday_readonly_client import validate_operation; print('✅ Import działa')"
```

### Test 2: Test walidacji
```python
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

### Test 3: Pełne demo
```python
python3 example_usage.py
```

### Test 4: Testy jednostkowe (wymaga pytest)
```bash
pip install pytest
pytest test_monday_readonly.py -v
```

---

## 📋 Wymagania systemowe

- **Python**: 3.7+
- **Zależności**: 
  - `monday` >= 1.3.0 (wymagane)
  - `pytest` >= 7.0.0 (opcjonalne, tylko dla testów)

---

## 🔧 Rozwiązywanie problemów

### Problem: "ModuleNotFoundError: No module named 'monday_readonly_client'"

**Rozwiązanie**: Upewnij się, że plik znajduje się w tym samym katalogu co Twój skrypt lub dodaj katalog do PYTHONPATH:

```bash
export PYTHONPATH="${PYTHONPATH}:/ścieżka/do/katalogu"
```

### Problem: "ModuleNotFoundError: No module named 'monday'"

**Rozwiązanie**: Zainstaluj bibliotekę Monday.com:

```bash
pip install monday
```

### Problem: "ImportError" w pakiecie

**Rozwiązanie**: Jeśli używasz jako pakiet, upewnij się że `__init__.py` jest obecny:

```bash
ls -la Monday_ReadOnly_Package/__init__.py
```

### Problem: Import działa, ale testy nie przechodzą

**Rozwiązanie**: Sprawdź czy masz zainstalowany pytest:

```bash
pip install pytest pytest-cov
```

---

## 🎯 Zalecana konfiguracja dla różnych projektów

### Projekt eksperymentalny / Jupyter Notebook
```bash
# Metoda 1 - pojedynczy plik
cp monday_readonly_client.py ./
```

### Projekt Flask/Django
```bash
# Metoda 2 - pakiet w lib/
mkdir -p lib
cp -r Monday_ReadOnly_Package lib/
```

### Projekt z Docker
Dodaj do `Dockerfile`:
```dockerfile
COPY Monday_ReadOnly_Package /app/Monday_ReadOnly_Package
RUN pip install -r /app/Monday_ReadOnly_Package/requirements.txt
```

### Projekt z Poetry
```toml
[tool.poetry.dependencies]
monday = "^1.3.0"
```
Następnie skopiuj `monday_readonly_client.py` do głównego folderu projektu.

---

## ✅ Gotowe!

Po instalacji przejdź do:
- [README.md](README.md) - główna dokumentacja
- [QUICKSTART.md](QUICKSTART.md) - szybki start
- [example_usage.py](example_usage.py) - przykłady użycia

---

**Potrzebujesz pomocy?** Zobacz [README_MONDAY_READONLY.md](README_MONDAY_READONLY.md) sekcja FAQ.

