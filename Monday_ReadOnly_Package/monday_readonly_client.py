"""
Monday.com Read-Only Client Wrapper
===================================

Moduł zapewniający ochronę przed przypadkowymi modyfikacjami danych w Monday.com.
Wszystkie operacje zapisu są blokowane.

Autor: TechSoup Impact Log Project
Wersja: 1.0
Licencja: MIT
"""

from typing import Any, Dict, List, Optional
import logging

logger = logging.getLogger(__name__)


class ReadOnlyModeException(Exception):
    """
    Wyjątek rzucany przy próbie wykonania operacji zapisu w trybie read-only.
    """
    
    def __init__(self, operation_name: str):
        self.operation_name = operation_name
        message = (
            f"❌ Operacja zapisu '{operation_name}' jest ZABLOKOWANA w trybie read-only. "
            f"Ten projekt używa dostępu tylko do odczytu, aby zapobiec przypadkowym modyfikacjom danych. "
            f"Zobacz dokumentację README_MONDAY_READONLY.md dla szczegółów."
        )
        super().__init__(message)


# Whitelist dozwolonych operacji READ
READ_ONLY_OPERATIONS = {
    'mcp_monday-mcp_get_board_items_page',
    'mcp_monday-mcp_get_board_info',
    'mcp_monday-mcp_get_board_activity',
    'mcp_monday-mcp_board_insights',
    'mcp_monday-mcp_list_users_and_teams',
    'mcp_monday-mcp_list_workspaces',
    'mcp_monday-mcp_workspace_info',
    'mcp_monday-mcp_search',
    'mcp_monday-mcp_read_docs',
    'mcp_monday-mcp_get_form',
    'mcp_monday-mcp_get_graphql_schema',
    'mcp_monday-mcp_get_type_details',
    'mcp_monday-mcp_get_column_type_info',
    'mcp_monday-mcp_get_monday_dev_sprints_boards',
    'mcp_monday-mcp_get_sprints_metadata',
    'mcp_monday-mcp_get_sprint_summary',
}

# Blacklist zablokowanych operacji WRITE
BLOCKED_OPERATIONS = {
    'mcp_monday-mcp_create_item',
    'mcp_monday-mcp_change_item_column_values',
    'mcp_monday-mcp_create_update',
    'mcp_monday-mcp_create_board',
    'mcp_monday-mcp_create_form',
    'mcp_monday-mcp_update_form',
    'mcp_monday-mcp_form_questions_editor',
    'mcp_monday-mcp_create_column',
    'mcp_monday-mcp_create_group',
    'mcp_monday-mcp_create_doc',
    'mcp_monday-mcp_create_dashboard',
    'mcp_monday-mcp_create_widget',
    'mcp_monday-mcp_update_workspace',
    'mcp_monday-mcp_update_folder',
    'mcp_monday-mcp_create_workspace',
    'mcp_monday-mcp_create_folder',
    'mcp_monday-mcp_move_object',
    'mcp_monday-mcp_delete_item',
    'mcp_monday-mcp_archive_item',
    'mcp_monday-mcp_duplicate_board',
}


def validate_operation(operation_name: str) -> None:
    """
    Waliduje czy operacja jest dozwolona w trybie read-only.
    
    Args:
        operation_name: Nazwa operacji MCP
        
    Raises:
        ReadOnlyModeException: Jeśli operacja jest zablokowana
    """
    if operation_name in BLOCKED_OPERATIONS:
        logger.error(f"🚫 Próba wykonania zablokowanej operacji: {operation_name}")
        raise ReadOnlyModeException(operation_name)
    
    if operation_name not in READ_ONLY_OPERATIONS:
        # Nieznana operacja - blokuj domyślnie dla bezpieczeństwa
        logger.warning(
            f"⚠️  Nieznana operacja '{operation_name}' - blokowanie dla bezpieczeństwa. "
            f"Jeśli to operacja read-only, dodaj ją do READ_ONLY_OPERATIONS."
        )
        raise ReadOnlyModeException(operation_name)
    
    logger.debug(f"✅ Operacja dozwolona: {operation_name}")


def validate_graphql_query(query: str) -> None:
    """
    Waliduje czy zapytanie GraphQL jest tylko do odczytu (bez mutacji).
    
    Args:
        query: Zapytanie GraphQL
        
    Raises:
        ReadOnlyModeException: Jeśli wykryto mutację
    """
    query_lower = query.lower().strip()
    
    # Sprawdź słowa kluczowe mutacji
    mutation_keywords = ['mutation', 'create', 'update', 'delete', 'archive', 'duplicate']
    
    for keyword in mutation_keywords:
        if keyword in query_lower and 'mutation' in query_lower:
            logger.error(f"🚫 Wykryto mutację GraphQL: {keyword}")
            raise ReadOnlyModeException(f"GraphQL mutation detected: {keyword}")
    
    logger.debug("✅ Zapytanie GraphQL jest read-only")


def is_read_operation(operation_name: str) -> bool:
    """
    Sprawdza czy operacja jest typu read-only.
    
    Args:
        operation_name: Nazwa operacji MCP
        
    Returns:
        True jeśli operacja jest read-only, False w przeciwnym razie
    """
    return operation_name in READ_ONLY_OPERATIONS


def is_write_operation(operation_name: str) -> bool:
    """
    Sprawdza czy operacja jest typu write.
    
    Args:
        operation_name: Nazwa operacji MCP
        
    Returns:
        True jeśli operacja jest write, False w przeciwnym razie
    """
    return operation_name in BLOCKED_OPERATIONS


def safe_monday_call(operation_name: str, monday_client_func, **kwargs) -> Any:
    """
    Bezpieczne wywołanie funkcji Monday.com z walidacją read-only.
    
    Args:
        operation_name: Nazwa operacji do walidacji
        monday_client_func: Funkcja klienta Monday.com do wywołania
        **kwargs: Argumenty przekazywane do funkcji
        
    Returns:
        Wynik wywołania funkcji Monday.com
        
    Raises:
        ReadOnlyModeException: Jeśli operacja jest zablokowana
        
    Example:
        >>> from monday import MondayClient
        >>> client = MondayClient(api_key)
        >>> result = safe_monday_call(
        ...     'mcp_monday-mcp_get_board_info',
        ...     client.boards.fetch_boards_by_id,
        ...     board_ids=[123456]
        ... )
    """
    validate_operation(operation_name)
    logger.info(f"🔍 Wykonywanie operacji read-only: {operation_name}")
    return monday_client_func(**kwargs)


# Export publiczny API
__all__ = [
    'ReadOnlyModeException',
    'READ_ONLY_OPERATIONS',
    'BLOCKED_OPERATIONS',
    'validate_operation',
    'validate_graphql_query',
    'is_read_operation',
    'is_write_operation',
    'safe_monday_call',
]


# Przykład użycia w __main__
if __name__ == "__main__":
    # Konfiguracja logowania
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    
    # Test walidacji
    print("🧪 Testowanie walidacji operacji...\n")
    
    # Test operacji read-only
    try:
        validate_operation('mcp_monday-mcp_get_board_info')
        print("✅ get_board_info - DOZWOLONE")
    except ReadOnlyModeException as e:
        print(f"❌ get_board_info - ZABLOKOWANE: {e}")
    
    # Test operacji write
    try:
        validate_operation('mcp_monday-mcp_create_item')
        print("✅ create_item - DOZWOLONE")
    except ReadOnlyModeException as e:
        print(f"❌ create_item - ZABLOKOWANE")
    
    # Test nieznanej operacji
    try:
        validate_operation('mcp_monday-mcp_unknown_operation')
        print("✅ unknown_operation - DOZWOLONE")
    except ReadOnlyModeException as e:
        print(f"❌ unknown_operation - ZABLOKOWANE")
    
    print("\n✨ Testy zakończone!")

