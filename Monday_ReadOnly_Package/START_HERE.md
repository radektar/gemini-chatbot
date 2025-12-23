# 👋 START HERE - Monday.com Read-Only Client

## 🎯 Jesteś tutaj po raz pierwszy?

Ten pakiet chroni Twoje dane w Monday.com przed przypadkowymi modyfikacjami.

### ⏱️ Masz 3 minuty? → [CZYTAJ_MNIE.md](CZYTAJ_MNIE.md) (Polski)
### ⏱️ Masz 5 minut? → [QUICKSTART.md](QUICKSTART.md) (English)
### 📚 Potrzebujesz pełnej dokumentacji? → [README.md](README.md)

---

## 🚀 Ultra szybki start (1 minuta)

### 1. Skopiuj plik
```bash
cp monday_readonly_client.py /twoj/projekt/
```

### 2. Zainstaluj
```bash
pip install monday
```

### 3. Użyj
```python
from monday_readonly_client import safe_monday_call, ReadOnlyModeException
```

**✅ Gotowe!**

---

## 🧪 Przetestuj zanim użyjesz

```bash
python3 monday_readonly_client.py
```

Powinno wyświetlić:
```
✅ get_board_info - DOZWOLONE
❌ create_item - ZABLOKOWANE
❌ unknown_operation - ZABLOKOWANE
```

---

## 📚 Przewodnik po plikach

| Dla kogo? | Plik | Czas czytania |
|-----------|------|---------------|
| 🇵🇱 **Polski użytkownik** | [CZYTAJ_MNIE.md](CZYTAJ_MNIE.md) | 3 min |
| 🆕 **Nowy użytkownik** | [QUICKSTART.md](QUICKSTART.md) | 5 min |
| 📖 **Szczegółowa dokumentacja** | [README.md](README.md) | 15 min |
| 🔧 **Instalacja** | [INSTALL.md](INSTALL.md) | 5 min |
| 🧑‍💻 **Developer** | [README_MONDAY_READONLY.md](README_MONDAY_READONLY.md) | 20 min |
| 💻 **Demo kodu** | `python3 example_usage.py` | 2 min |
| 📦 **Info o pakiecie** | [PACKAGE_INFO.md](PACKAGE_INFO.md) | 5 min |

---

## ❓ Szybkie odpowiedzi

### Co to robi?
Blokuje operacje zapisu w Monday.com (create, update, delete), ale pozwala na bezpieczne czytanie danych.

### Dlaczego potrzebuję tego?
Aby bezpiecznie eksperymentować z danymi produkcyjnymi bez ryzyka ich uszkodzenia.

### Czy mogę to wyłączyć?
**Nie.** To celowa decyzja dla maksymalnego bezpieczeństwa.

### Jak użyć w moim projekcie?
1. Skopiuj `monday_readonly_client.py`
2. `pip install monday`
3. Importuj i używaj

### Czy to bezpłatne?
**Tak.** Licencja MIT - wolne do użytku w dowolnych projektach.

---

## 🆘 Problemy?

1. **Nie wiem od czego zacząć** → [CZYTAJ_MNIE.md](CZYTAJ_MNIE.md) (Polski)
2. **Import nie działa** → `pip install monday`
3. **Chcę zobaczyć demo** → `python3 example_usage.py`
4. **Potrzebuję przykładów** → [QUICKSTART.md](QUICKSTART.md)
5. **Mam konkretne pytanie** → [README_MONDAY_READONLY.md](README_MONDAY_READONLY.md) sekcja FAQ

---

## 📦 Co jest w tym pakiecie?

| Typ | Ilość | Pliki |
|-----|-------|-------|
| 🔧 **Kod** | 4 pliki | `monday_readonly_client.py`, `example_usage.py`, `test_*.py`, `__init__.py` |
| 📚 **Dokumentacja** | 7 plików | `README.md`, `CZYTAJ_MNIE.md`, `QUICKSTART.md`, `INSTALL.md`, itp. |
| ⚙️ **Konfiguracja** | 3 pliki | `requirements.txt`, `.gitignore`, `LICENSE` |

**Razem**: 14 plików, ~2000 linii

---

## ✨ Następny krok

### 🇵🇱 Mówisz po polsku?
→ Przejdź do [CZYTAJ_MNIE.md](CZYTAJ_MNIE.md)

### 🌍 Prefer English?
→ Go to [QUICKSTART.md](QUICKSTART.md) or [README.md](README.md)

### 💻 Want to see code examples?
→ Run `python3 example_usage.py`

---

**🎉 Witaj w Monday.com Read-Only Client!**

Bezpieczne eksperymentowanie z danymi produkcyjnymi zaczyna się tutaj.

---

**Źródło**: TechSoup Impact Log Project  
**Licencja**: MIT  
**Wersja**: 1.0.0

