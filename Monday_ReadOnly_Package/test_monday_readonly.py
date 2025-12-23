"""
Testy jednostkowe dla monday_readonly_client
"""

import pytest
from monday_readonly_client import (
    validate_operation,
    validate_graphql_query,
    is_read_operation,
    is_write_operation,
    ReadOnlyModeException,
    READ_ONLY_OPERATIONS,
    BLOCKED_OPERATIONS,
)


class TestReadOperations:
    """Testy dla operacji read-only"""
    
    def test_read_operations_allowed(self):
        """Test czy operacje read są dozwolone"""
        read_ops = [
            'mcp_monday-mcp_get_board_info',
            'mcp_monday-mcp_get_board_items_page',
            'mcp_monday-mcp_search',
            'mcp_monday-mcp_list_workspaces',
        ]
        
        for op in read_ops:
            # Nie powinno rzucić wyjątku
            validate_operation(op)
    
    def test_is_read_operation(self):
        """Test funkcji is_read_operation"""
        assert is_read_operation('mcp_monday-mcp_get_board_info') is True
        assert is_read_operation('mcp_monday-mcp_create_item') is False
        assert is_read_operation('unknown_operation') is False


class TestWriteOperations:
    """Testy dla operacji write (zablokowanych)"""
    
    def test_write_operations_blocked(self):
        """Test czy operacje write są zablokowane"""
        write_ops = [
            'mcp_monday-mcp_create_item',
            'mcp_monday-mcp_create_board',
            'mcp_monday-mcp_delete_item',
            'mcp_monday-mcp_change_item_column_values',
        ]
        
        for op in write_ops:
            with pytest.raises(ReadOnlyModeException):
                validate_operation(op)
    
    def test_is_write_operation(self):
        """Test funkcji is_write_operation"""
        assert is_write_operation('mcp_monday-mcp_create_item') is True
        assert is_write_operation('mcp_monday-mcp_get_board_info') is False
        assert is_write_operation('unknown_operation') is False


class TestUnknownOperations:
    """Testy dla nieznanych operacji"""
    
    def test_unknown_operation_blocked(self):
        """Test czy nieznane operacje są blokowane (fail-safe)"""
        with pytest.raises(ReadOnlyModeException):
            validate_operation('mcp_monday-mcp_totally_unknown_operation')


class TestGraphQLValidation:
    """Testy walidacji zapytań GraphQL"""
    
    def test_query_allowed(self):
        """Test czy zapytanie query jest dozwolone"""
        query = """
        query {
          boards(ids: [123456]) {
            name
          }
        }
        """
        # Nie powinno rzucić wyjątku
        validate_graphql_query(query)
    
    def test_mutation_blocked(self):
        """Test czy mutacja jest zablokowana"""
        mutation = """
        mutation {
          create_item(board_id: 123456, item_name: "Test") {
            id
          }
        }
        """
        with pytest.raises(ReadOnlyModeException):
            validate_graphql_query(mutation)


class TestExceptionDetails:
    """Testy szczegółów wyjątków"""
    
    def test_exception_message(self):
        """Test czy wyjątek zawiera odpowiedni komunikat"""
        try:
            validate_operation('mcp_monday-mcp_create_item')
            assert False, "Powinien rzucić wyjątek"
        except ReadOnlyModeException as e:
            assert 'mcp_monday-mcp_create_item' in str(e)
            assert 'ZABLOKOWANA' in str(e)
            assert e.operation_name == 'mcp_monday-mcp_create_item'


class TestWhitelistBlacklistConsistency:
    """Testy spójności whitelist/blacklist"""
    
    def test_no_overlap(self):
        """Test czy whitelist i blacklist się nie pokrywają"""
        overlap = READ_ONLY_OPERATIONS & BLOCKED_OPERATIONS
        assert len(overlap) == 0, f"Operacje w obu listach: {overlap}"
    
    def test_lists_not_empty(self):
        """Test czy listy nie są puste"""
        assert len(READ_ONLY_OPERATIONS) > 0
        assert len(BLOCKED_OPERATIONS) > 0


if __name__ == '__main__':
    pytest.main([__file__, '-v'])

