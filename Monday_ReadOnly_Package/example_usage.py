"""
Przykładowy skrypt demonstracyjny Monday.com Read-Only Client
==============================================================

Ten skrypt pokazuje podstawowe użycie mechanizmu read-only.
Wymaga ustawienia zmiennej środowiskowej MONDAY_API_KEY.

Użycie:
    export MONDAY_API_KEY="your_api_key_here"
    python example_usage.py
"""

import os
import logging
from monday_readonly_client import (
    validate_operation,
    validate_graphql_query,
    is_read_operation,
    is_write_operation,
    ReadOnlyModeException,
    safe_monday_call,
)

# Konfiguracja logowania
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def demo_validation():
    """Demonstracja walidacji operacji"""
    print("\n" + "="*60)
    print("🔍 DEMO 1: Walidacja operacji")
    print("="*60)
    
    operations = [
        ('mcp_monday-mcp_get_board_info', 'read'),
        ('mcp_monday-mcp_create_item', 'write'),
        ('mcp_monday-mcp_search', 'read'),
        ('mcp_monday-mcp_delete_item', 'write'),
        ('mcp_monday-mcp_unknown_operation', 'unknown'),
    ]
    
    for op, expected_type in operations:
        try:
            validate_operation(op)
            print(f"✅ {op[:30]:30} - DOZWOLONA")
        except ReadOnlyModeException as e:
            print(f"❌ {op[:30]:30} - ZABLOKOWANA ({expected_type})")


def demo_type_checking():
    """Demonstracja sprawdzania typu operacji"""
    print("\n" + "="*60)
    print("🔎 DEMO 2: Sprawdzanie typu operacji")
    print("="*60)
    
    operations = [
        'mcp_monday-mcp_get_board_info',
        'mcp_monday-mcp_create_item',
        'mcp_monday-mcp_search',
    ]
    
    for op in operations:
        if is_read_operation(op):
            print(f"📖 {op[:40]:40} - READ")
        elif is_write_operation(op):
            print(f"✏️  {op[:40]:40} - WRITE")
        else:
            print(f"❓ {op[:40]:40} - UNKNOWN")


def demo_graphql_validation():
    """Demonstracja walidacji zapytań GraphQL"""
    print("\n" + "="*60)
    print("📝 DEMO 3: Walidacja zapytań GraphQL")
    print("="*60)
    
    # Zapytanie read-only
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
    
    print("\n📖 Test zapytania READ:")
    try:
        validate_graphql_query(query_read)
        print("✅ Zapytanie jest bezpieczne (query)")
    except ReadOnlyModeException as e:
        print(f"❌ Zablokowane: {e}")
    
    # Mutacja
    mutation = """
    mutation {
      create_item(board_id: 123456, item_name: "New Item") {
        id
      }
    }
    """
    
    print("\n✏️  Test mutacji WRITE:")
    try:
        validate_graphql_query(mutation)
        print("❌ Mutacja NIE została zablokowana (BŁĄD!)")
    except ReadOnlyModeException as e:
        print("✅ Mutacja poprawnie zablokowana")


def demo_safe_call():
    """Demonstracja bezpiecznego wywołania (bez rzeczywistego API)"""
    print("\n" + "="*60)
    print("🛡️  DEMO 4: Bezpieczne wywołanie API")
    print("="*60)
    
    # Symulacja funkcji klienta Monday.com
    def mock_fetch_boards(*args, **kwargs):
        return [{'id': 123456, 'name': 'Test Board'}]
    
    def mock_create_item(*args, **kwargs):
        return {'id': 999, 'name': 'New Item'}
    
    # Test operacji read - powinno przejść walidację
    print("\n📖 Test operacji READ (get_board_info):")
    try:
        result = safe_monday_call(
            'mcp_monday-mcp_get_board_info',
            mock_fetch_boards,
            board_ids=[123456]
        )
        print(f"✅ Sukces: {result}")
    except ReadOnlyModeException as e:
        print(f"❌ Zablokowane: {e}")
    
    # Test operacji write - powinno zostać zablokowane
    print("\n✏️  Test operacji WRITE (create_item):")
    try:
        result = safe_monday_call(
            'mcp_monday-mcp_create_item',
            mock_create_item,
            board_id=123456,
            item_name="New Item"
        )
        print(f"❌ Błąd zabezpieczeń: operacja NIE została zablokowana!")
    except ReadOnlyModeException as e:
        print(f"✅ Poprawnie zablokowane")


def demo_real_api_integration():
    """Demonstracja z prawdziwym API (wymaga API key)"""
    print("\n" + "="*60)
    print("🌐 DEMO 5: Integracja z prawdziwym API Monday.com")
    print("="*60)
    
    api_key = os.getenv('MONDAY_API_KEY')
    
    if not api_key:
        print("⚠️  Brak zmiennej środowiskowej MONDAY_API_KEY")
        print("   Aby przetestować z prawdziwym API:")
        print("   export MONDAY_API_KEY='your_api_key_here'")
        return
    
    try:
        from monday import MondayClient
        
        client = MondayClient(api_key)
        print("✅ Klient Monday.com zainicjalizowany")
        
        # Przykład bezpiecznego wywołania
        print("\n📖 Próba pobrania workspace'ów...")
        try:
            # W prawdziwej implementacji:
            # workspaces = safe_monday_call(
            #     'mcp_monday-mcp_list_workspaces',
            #     client.workspaces.query,
            # )
            print("   (funkcja bezpiecznego wywołania jest gotowa do użycia)")
        except Exception as e:
            print(f"   Błąd API: {e}")
            
    except ImportError:
        print("⚠️  Biblioteka 'monday' nie jest zainstalowana")
        print("   Zainstaluj: pip install monday")


def main():
    """Główna funkcja demonstracyjna"""
    print("\n" + "="*60)
    print("🚀 Monday.com Read-Only Client - Demonstracja")
    print("="*60)
    
    demo_validation()
    demo_type_checking()
    demo_graphql_validation()
    demo_safe_call()
    demo_real_api_integration()
    
    print("\n" + "="*60)
    print("✨ Demonstracja zakończona!")
    print("="*60)
    print("\n📚 Zobacz README_MONDAY_READONLY.md dla pełnej dokumentacji")


if __name__ == '__main__':
    main()

