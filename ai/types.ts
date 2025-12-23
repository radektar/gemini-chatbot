export interface QueryContext {
  intent: {
    action: "find" | "analyze" | "generate" | "compare" | "summarize" | "explain";
    object: string;
    confidence: number; // 0-1
  };
  dataSources: {
    primary?: "monday" | "slack" | "impactlog" | "unknown";
    filters?: Record<string, any>;
    confidence: number; // 0-1
  };
  audience: {
    type?: "donor" | "partner" | "internal" | "unknown";
    purpose?: string;
    confidence: number; // 0-1
  };
  output: {
    format?: "narrative" | "bullets" | "table" | "email" | "raw";
    length?: "short" | "medium" | "long";
    confidence: number; // 0-1
  };
  averageConfidence: number; // 0-1
}


