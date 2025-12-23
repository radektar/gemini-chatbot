"""
Monday.com Read-Only Client Package
====================================

Pakiet zabezpieczający przed przypadkowymi modyfikacjami danych w Monday.com.

Podstawowe użycie:
    from monday_readonly_client import safe_monday_call, ReadOnlyModeException
    
Zobacz README_MONDAY_READONLY.md dla pełnej dokumentacji.
"""

from monday_readonly_client import (
    ReadOnlyModeException,
    READ_ONLY_OPERATIONS,
    BLOCKED_OPERATIONS,
    validate_operation,
    validate_graphql_query,
    is_read_operation,
    is_write_operation,
    safe_monday_call,
)

__version__ = '1.0.0'
__author__ = 'TechSoup Impact Log Project'

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

