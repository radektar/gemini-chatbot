"use client";

interface SlackMessagesProps {
  result: {
    query?: string;
    results?: Array<{
      channel: string;
      timestamp: string;
      user?: string;
      text: string;
    }>;
    totalFound?: number;
    error?: string;
  };
}

export function SlackMessages({ result }: SlackMessagesProps) {
  if (result.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">Błąd: {result.error}</p>
      </div>
    );
  }

  if (!result.results || result.results.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">
          Nie znaleziono wiadomości dla zapytania: {result.query || "—"}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-3">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
          Slack
        </span>
        <span className="text-sm text-muted-foreground">
          {result.totalFound || result.results.length} wyników
        </span>
        {result.query && (
          <span className="text-xs text-muted-foreground">
            dla: &quot;{result.query}&quot;
          </span>
        )}
      </div>
      <div className="space-y-3">
        {result.results.map((msg, index) => (
          <div
            key={index}
            className="p-3 bg-muted/50 rounded border border-border hover:bg-muted transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-muted-foreground">
                  #{msg.channel}
                </span>
                {msg.user && (
                  <span className="text-xs text-muted-foreground">
                    @{msg.user}
                  </span>
                )}
              </div>
              <span className="text-xs text-muted-foreground">
                {new Date(msg.timestamp).toLocaleString("pl-PL")}
              </span>
            </div>
            <p className="text-sm text-foreground whitespace-pre-wrap">
              {msg.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

