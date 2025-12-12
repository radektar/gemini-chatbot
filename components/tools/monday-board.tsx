"use client";

interface MondayBoardProps {
  result: {
    boards?: Array<{
      id: string;
      name: string;
      description: string;
    }>;
    error?: string;
  };
}

export function MondayBoard({ result }: MondayBoardProps) {
  if (result.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">Błąd: {result.error}</p>
      </div>
    );
  }

  if (!result.boards || result.boards.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Brak dostępnych tablic</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded font-medium">
          Monday.com
        </span>
        <span className="text-sm text-muted-foreground">
          {result.boards.length} tablic
        </span>
      </div>
      <div className="space-y-2">
        {result.boards.map((board) => (
          <div
            key={board.id}
            className="p-3 bg-muted/50 rounded border border-border hover:bg-muted transition-colors"
          >
            <div className="font-medium text-sm">{board.name}</div>
            {board.description && (
              <div className="text-xs text-muted-foreground mt-1">
                {board.description}
              </div>
            )}
            <div className="text-xs text-muted-foreground mt-1">
              ID: {board.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

