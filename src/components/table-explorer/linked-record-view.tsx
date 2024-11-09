import { ScrollArea } from "@/components/ui/scroll-area";

type DatabaseValue = string | number | boolean | null | Date;

interface LinkedRecordViewProps {
  data: Record<string, DatabaseValue | Record<string, DatabaseValue>>;
}

export function LinkedRecordView({ data }: LinkedRecordViewProps) {
  return (
    <ScrollArea className="h-[calc(100vh-150px)]">
      <div className="space-y-3 pr-4">
        {Object.entries(data).map(([key, value]) => (
          <div
            key={key}
            className="rounded-lg border bg-card p-3 space-y-1.5 text-card-foreground"
          >
            <div className="text-sm font-medium text-muted-foreground">
              {key}
            </div>
            <div>
              {value === null ? (
                <span className="text-sm text-muted-foreground italic">
                  NULL
                </span>
              ) : typeof value === "object" ? (
                <pre className="text-sm bg-muted/50 p-2 rounded-md overflow-auto max-h-[100px]">
                  {JSON.stringify(value, null, 2)}
                </pre>
              ) : (
                <span className="text-sm font-mono">{String(value)}</span>
              )}
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
