"use client";

import { History, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { HistoryEntry } from "@/lib/types";

interface Props {
  entries: HistoryEntry[];
  onRestore: (entry: HistoryEntry) => void;
  onClear: () => void;
}

export function HistoryPanel({ entries, onRestore, onClear }: Props): React.JSX.Element {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="size-4" /> History
          </CardTitle>
          <CardDescription>Last {entries.length} unification(s) on this device</CardDescription>
        </div>
        {entries.length > 0 && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="size-4" /> Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Nothing yet. Segregate a paragraph and convert it — it will appear here.
          </p>
        ) : (
          <ul className="space-y-2">
            {entries.map((e) => (
              <li key={e.id}>
                <button
                  type="button"
                  onClick={() => onRestore(e)}
                  className="w-full rounded-lg border p-3 text-left transition-colors hover:bg-accent"
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                    <span>{new Date(e.createdAt).toLocaleString()}</span>
                    <span className="font-medium">→ {e.targetLangName}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm">{e.unifiedPreview}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {e.segmentCount} sentence(s) · {e.detectedLanguages.join(", ") || "—"}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
