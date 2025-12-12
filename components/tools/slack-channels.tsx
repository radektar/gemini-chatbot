"use client";

interface SlackChannelsProps {
  result: {
    channels?: Array<{
      id: string;
      name: string;
      isPrivate: boolean;
    }>;
    error?: string;
  };
}

export function SlackChannels({ result }: SlackChannelsProps) {
  if (result.error) {
    return (
      <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
        <p className="text-sm text-destructive">Błąd: {result.error}</p>
      </div>
    );
  }

  if (!result.channels || result.channels.length === 0) {
    return (
      <div className="bg-muted rounded-lg p-4">
        <p className="text-sm text-muted-foreground">Brak dostępnych kanałów</p>
      </div>
    );
  }

  return (
    <div className="bg-card border rounded-lg p-4 space-y-2">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 px-2 py-1 rounded font-medium">
          Slack
        </span>
        <span className="text-sm text-muted-foreground">
          {result.channels.length} kanałów
        </span>
      </div>
      <div className="space-y-2">
        {result.channels.map((channel) => (
          <div
            key={channel.id}
            className="p-3 bg-muted/50 rounded border border-border hover:bg-muted transition-colors flex items-center justify-between"
          >
            <div>
              <div className="font-medium text-sm">
                #{channel.name}
                {channel.isPrivate && (
                  <span className="text-xs text-muted-foreground ml-2">
                    (prywatny)
                  </span>
                )}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                ID: {channel.id}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

