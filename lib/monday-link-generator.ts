/**
 * Monday.com Link Generator
 * 
 * Generuje linki do Monday.com items i formatuje referencje źródłowe
 * zgodnie z Evidence Policy (Faza 05).
 */

export interface MondaySource {
  boardId: string | number;
  itemId: string | number;
  columnName?: string;
  columnId?: string;
}

/**
 * Generuje link do Monday.com item
 * 
 * @param boardId - ID boardu (string lub number)
 * @param itemId - ID itemu (string lub number)
 * @returns URL do itemu w Monday.com
 */
export function generateMondayItemLink(
  boardId: string | number,
  itemId: string | number
): string {
  // Monday.com URL format: https://monday.com/boards/{boardId}/pulses/{itemId}
  // Note: Monday.com uses "pulses" in URL but "items" in API
  return `https://monday.com/boards/${boardId}/pulses/${itemId}`;
}

/**
 * Formatuje referencję źródła dla Monday.com item
 * 
 * @param source - Informacje o źródle
 * @returns Sformatowana referencja w formacie markdown
 * 
 * @example
 * formatSourceReference({
 *   boardId: 123,
 *   itemId: 456,
 *   columnName: "Beneficjenci"
 * })
 * // Returns: "[Monday Item #456, kolumna \"Beneficjenci\"](https://monday.com/boards/123/pulses/456)"
 */
export function formatSourceReference(source: MondaySource): string {
  const link = generateMondayItemLink(source.boardId, source.itemId);
  
  const parts: string[] = [];
  parts.push(`Monday Item #${source.itemId}`);
  
  if (source.columnName) {
    parts.push(`kolumna "${source.columnName}"`);
  } else if (source.columnId) {
    parts.push(`kolumna ID: ${source.columnId}`);
  }
  
  const label = parts.join(", ");
  return `[${label}](${link})`;
}

/**
 * Wyodrębnia informacje o źródle z wyników narzędzi Monday.com
 * 
 * @param toolResult - Wynik z narzędzia Monday.com MCP
 * @param columnName - Opcjonalna nazwa kolumny do wyszukania
 * @returns Tablica źródeł Monday.com lub null jeśli nie znaleziono
 */
export function extractMondaySources(
  toolResult: any,
  columnName?: string
): MondaySource[] | null {
  const sources: MondaySource[] = [];
  
  // Helper function to recursively search for items
  const findItems = (obj: any, path = ""): any[] => {
    if (!obj || typeof obj !== "object") {
      return [];
    }
    
    // Check for items array directly
    if (Array.isArray(obj.items)) {
      return obj.items;
    }
    
    // Check for items_page structure (Monday.com specific)
    if (obj.items_page && Array.isArray(obj.items_page.items)) {
      return obj.items_page.items;
    }
    
    // Check for board with items
    if (obj.board && obj.board.items_page && Array.isArray(obj.board.items_page.items)) {
      return obj.board.items_page.items;
    }
    
    // Check for boards array with items
    if (Array.isArray(obj.boards)) {
      const allItems: any[] = [];
      for (const board of obj.boards) {
        if (board.items_page && Array.isArray(board.items_page.items)) {
          allItems.push(...board.items_page.items);
        }
      }
      if (allItems.length > 0) {
        return allItems;
      }
    }
    
    // Recursively search in nested objects
    for (const key in obj) {
      if (key !== "content" && typeof obj[key] === "object") {
        const found = findItems(obj[key], `${path}.${key}`);
        if (found.length > 0) {
          return found;
        }
      }
    }
    
    return [];
  };
  
  const items = findItems(toolResult);
  
  if (items.length === 0) {
    return null;
  }
  
  // Extract board ID from result
  let boardId: string | number | null = null;
  
  // Try to find board ID in various locations
  if (toolResult.board && toolResult.board.id) {
    boardId = toolResult.board.id;
  } else if (toolResult.boardId) {
    boardId = toolResult.boardId;
  } else if (toolResult.boards && toolResult.boards.length > 0 && toolResult.boards[0].id) {
    boardId = toolResult.boards[0].id;
  }
  
  if (!boardId) {
    // If we can't find board ID, we can't generate links
    return null;
  }
  
  // Extract sources from items
  for (const item of items) {
    if (item.id) {
      sources.push({
        boardId,
        itemId: item.id,
        columnName: columnName,
      });
    }
  }
  
  return sources.length > 0 ? sources : null;
}

