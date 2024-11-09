"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ExternalLink } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useRef, useEffect } from "react";

import { Separator } from "@/components/ui/separator";
import { LinkedRecordView } from "./linked-record-view";
import { fetchLinkedRecord } from "@/app/actions";
import { usePathname } from "next/navigation";
import { TableRow, TableColumn, DatabaseValue } from "@/types/database";

interface LinkedRecordData {
  schema: string;
  table: string;
  data: Record<string, DatabaseValue> | null;
}

interface DataTableProps {
  columns: TableColumn[];
  data: TableRow[];
  onSelectionChange: (selectedIds: string[]) => void;
}

const DATA_TYPE_WIDTHS: Record<string, string> = {
  integer: "w-[100px] min-w-[100px]",
  bigint: "w-[120px] min-w-[120px]",
  text: "w-[300px] min-w-[300px]",
  varchar: "w-[300px] min-w-[300px]",
  boolean: "w-[80px] min-w-[80px]",
  timestamp: "w-[300px] min-w-[300px]",
  date: "w-[120px] min-w-[120px]",
  numeric: "w-[120px] min-w-[120px]",
  uuid: "w-[280px] min-w-[280px]",
  jsonb: "w-[300px] min-w-[300px]",
};

function formatCellValue(value: unknown): { value: string; isNull: boolean } {
  if (value === null || value === undefined) {
    return { value: "NULL", isNull: true };
  }
  if (typeof value === "object") {
    return { value: JSON.stringify(value), isNull: false };
  }
  if (typeof value === "boolean") {
    return { value: value ? "true" : "false", isNull: false };
  }
  if (value === "") {
    return { value: "NULL", isNull: true };
  }
  return { value: String(value), isNull: false };
}

// Helper function to check if a column is a foreign key
function isLookupColumn(columnName: string): boolean {
  // This is a simplified check - you should implement proper foreign key detection
  return columnName.endsWith("_id") || columnName.includes("_fk_");
}

export function DataTable({
  columns,
  data,
  onSelectionChange,
}: DataTableProps) {
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [linkedRecord, setLinkedRecord] = useState<LinkedRecordData | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const checkboxRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (checkboxRef.current) {
      checkboxRef.current.indeterminate =
        selectedRows.size > 0 && selectedRows.size < data.length;
    }
  }, [selectedRows.size, data.length]);

  const handleLinkClick = useCallback(
    async (
      schema: string,
      table: string,
      column: string,
      value: DatabaseValue | undefined
    ) => {
      if (value === undefined || value === null) {
        return; // Don't proceed if value is undefined or null
      }

      try {
        setIsLoading(true);
        const result = await fetchLinkedRecord(
          schema,
          table,
          column,
          String(value)
        );
        setLinkedRecord(result);
      } catch (error) {
        console.error("Error fetching linked record:", error);
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Get the current schema and table from the URL
  const pathname = usePathname();
  const [schema, table] = pathname.split("/").filter(Boolean);

  const handleSelectAll = useCallback(
    (checked: boolean) => {
      if (checked) {
        const allIds = data
          .filter((row) => row.id)
          .map((row) => String(row.id));
        setSelectedRows(new Set(allIds));
        onSelectionChange(allIds);
      } else {
        setSelectedRows(new Set());
        onSelectionChange([]);
      }
    },
    [data, onSelectionChange]
  );

  const handleSelectRow = useCallback(
    (id: string, checked: boolean) => {
      const newSelection = new Set(selectedRows);
      if (checked) {
        newSelection.add(id);
      } else {
        newSelection.delete(id);
      }
      setSelectedRows(newSelection);
      onSelectionChange(Array.from(newSelection));
    },
    [selectedRows, onSelectionChange]
  );

  return (
    <div className="h-full text-sm">
      <div className="h-full overflow-auto">
        <div className="inline-block min-w-full align-middle">
          {/* Fixed Header */}
          <div className="sticky top-0 z-20 bg-muted border-b">
            <div className="flex">
              <div className="w-[50px] min-w-[50px] border-r flex items-center p-2 sticky left-0 bg-muted">
                <input
                  ref={checkboxRef}
                  type="checkbox"
                  checked={selectedRows.size === data.length && data.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                />
              </div>
              {columns.map((column, index) => (
                <div
                  key={column.column_name}
                  className={cn(
                    "flex items-center p-2",
                    DATA_TYPE_WIDTHS[column.data_type.toLowerCase()] ||
                      "w-[200px] min-w-[200px]",
                    index < columns.length - 1 ? "border-r" : ""
                  )}
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="truncate">{column.column_name}</span>
                    <Badge variant="outline" className="shrink-0 ml-2">
                      {column.data_type}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Table Body */}
          <div>
            {data.map((row, rowIndex) => (
              <div key={rowIndex} className="flex border-b hover:bg-muted/50">
                <div className="w-[50px] min-w-[50px] border-r bg-background sticky left-0 flex items-center p-2">
                  <input
                    type="checkbox"
                    checked={selectedRows.has(String(row.id))}
                    onChange={(e) =>
                      handleSelectRow(String(row.id), e.target.checked)
                    }
                  />
                </div>
                {columns.map((column, colIndex) => {
                  const { value, isNull } = formatCellValue(
                    row[column.column_name]
                  );
                  const isLookup = isLookupColumn(column.column_name);

                  return (
                    <div
                      key={column.column_name}
                      className={cn(
                        "flex items-center p-2",
                        DATA_TYPE_WIDTHS[column.data_type.toLowerCase()] ||
                          "w-[200px] min-w-[200px]",
                        colIndex < columns.length - 1 ? "border-r" : ""
                      )}
                    >
                      <div className="flex items-center justify-between w-full">
                        <div
                          className={cn(
                            "truncate",
                            isNull && "text-muted-foreground italic"
                          )}
                        >
                          {value}
                        </div>
                        {isLookup && !isNull && (
                          <Sheet>
                            <SheetTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="ml-2 h-6 w-6 p-0"
                                onClick={() => {
                                  setSelectedRow(row);
                                  setSelectedColumn(column.column_name);
                                  const value = row[column.column_name];
                                  if (value !== undefined && value !== null) {
                                    handleLinkClick(
                                      schema,
                                      table,
                                      column.column_name,
                                      value
                                    );
                                  }
                                }}
                              >
                                <ExternalLink className="h-4 w-4" />
                              </Button>
                            </SheetTrigger>
                            <SheetContent>
                              <SheetHeader className="space-y-4">
                                <div className="space-y-2">
                                  <SheetTitle className="text-lg font-semibold">
                                    Linked Record
                                  </SheetTitle>
                                  <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                      <span>From:</span>
                                      <Badge variant="outline">
                                        {linkedRecord?.schema}.
                                        {linkedRecord?.table}
                                      </Badge>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span>Key:</span>
                                      <Badge variant="outline">
                                        {selectedRow?.[selectedColumn] != null
                                          ? String(selectedRow[selectedColumn])
                                          : ""}
                                      </Badge>
                                    </div>
                                  </div>
                                </div>
                                <Separator />
                              </SheetHeader>

                              <div className="mt-6">
                                {isLoading ? (
                                  <div className="flex items-center justify-center p-4">
                                    Loading...
                                  </div>
                                ) : linkedRecord?.data ? (
                                  <LinkedRecordView data={linkedRecord.data} />
                                ) : (
                                  <div className="text-sm text-muted-foreground p-4">
                                    No linked record found
                                  </div>
                                )}
                              </div>
                            </SheetContent>
                          </Sheet>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
