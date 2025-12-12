"use client";

interface MondayTaskProps {
  result: {
    boardId?: string;
    tasks?: Array<{
      id: string;
      name: string;
      status: string;
      columns: Array<{
        id: string;
        text: string;
      }>;
    }>;
    error?: string;
  };
}

export function MondayTask({ result }: MondayTaskProps) {
  if (result.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">Błąd: {result.error}</p>
      </div>
    );
  }

  if (!result.tasks || result.tasks.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Brak zadań w tej tablicy</p>
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
          {result.tasks.length} zadań
        </span>
      </div>
      <div className="space-y-2">
        {result.tasks.map((task) => (
          <div
            key={task.id}
            className="p-3 bg-muted/50 rounded border border-border hover:bg-muted transition-colors"
          >
            <div className="font-medium text-sm mb-2">{task.name}</div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs bg-background px-2 py-0.5 rounded">
                Status: {task.status}
              </span>
              {task.columns.slice(0, 3).map((col) => (
                <span
                  key={col.id}
                  className="text-xs text-muted-foreground bg-background px-2 py-0.5 rounded"
                >
                  {col.text || "—"}
                </span>
              ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              ID: {task.id}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

