"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Sidebar } from "./sidebar";
import { Toolbar } from "./toolbar";
import { DataTable } from "./data-table";
import { Footer } from "./footer";
import { deleteRecords, updateRecord } from "@/app/actions";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { InsertRecordView } from "@/components/table-explorer/insert-record-view";
import { useToast } from "@/hooks/use-toast";
import {
  TableColumn,
  TableRow,
  DatabaseValue,
  RecordValues,
} from "@/types/database";

interface TableExplorerProps {
  currentSchema: string;
  currentTable?: string;
  schemas: string[];
  tables: string[];
  columns?: TableColumn[];
  data?: TableRow[];
  totalRecords?: number;
}

// Helper function to transform TableRow to RecordValues
function transformToRecordValues(row: TableRow): RecordValues {
  const recordValues: RecordValues = {};
  Object.entries(row).forEach(([key, value]) => {
    // Only include defined values
    if (value !== undefined) {
      recordValues[key] = value as DatabaseValue;
    }
  });
  return recordValues;
}

export default function TableExplorer({
  currentSchema,
  currentTable,
  schemas,
  tables,
  columns = [],
  data = [],
  totalRecords = 0,
}: TableExplorerProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pageFromUrl = Number(searchParams.get("page")) || 1;
  const PAGE_SIZE = 100;

  const [activeSort, setActiveSort] = useState<{
    column: string;
    direction: "asc" | "desc";
  } | null>(null);

  const [activeFilter, setActiveFilter] = useState<{
    column: string;
    operator: string;
    value: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<"data" | "definition">("data");

  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [selectedRow, setSelectedRow] = useState<TableRow | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { toast } = useToast();

  const handlePageChange = (newPage: number) => {
    if (currentSchema && currentTable) {
      const params = new URLSearchParams(searchParams);
      params.set("page", newPage.toString());
      if (activeSort) {
        params.set("sortColumn", activeSort.column);
        params.set("sortDirection", activeSort.direction);
      }
      if (activeFilter) {
        params.set("filterColumn", activeFilter.column);
        params.set("filterOperator", activeFilter.operator);
        params.set("filterValue", activeFilter.value);
      }
      router.push(`/${currentSchema}/${currentTable}?${params.toString()}`);
    }
  };

  const handleRefresh = () => {
    router.refresh();
  };

  const handleSort = (column: string, direction: "asc" | "desc") => {
    setActiveSort({ column, direction });
    const params = new URLSearchParams(searchParams);
    params.set("sortColumn", column);
    params.set("sortDirection", direction);
    params.set("page", "1");
    if (activeFilter) {
      params.set("filterColumn", activeFilter.column);
      params.set("filterOperator", activeFilter.operator);
      params.set("filterValue", activeFilter.value);
    }
    router.push(`/${currentSchema}/${currentTable}?${params.toString()}`);
  };

  const handleFilter = (column: string, operator: string, value: string) => {
    setActiveFilter({ column, operator, value });
    const params = new URLSearchParams(searchParams);
    params.set("filterColumn", column);
    params.set("filterOperator", operator);
    params.set("filterValue", value);
    params.set("page", "1");
    if (activeSort) {
      params.set("sortColumn", activeSort.column);
      params.set("sortDirection", activeSort.direction);
    }
    router.push(`/${currentSchema}/${currentTable}?${params.toString()}`);
  };

  const handleClearSort = () => {
    setActiveSort(null);
    const params = new URLSearchParams(searchParams);
    params.delete("sortColumn");
    params.delete("sortDirection");
    if (activeFilter) {
      params.set("filterColumn", activeFilter.column);
      params.set("filterOperator", activeFilter.operator);
      params.set("filterValue", activeFilter.value);
    }
    router.push(`/${currentSchema}/${currentTable}?${params.toString()}`);
  };

  const handleClearFilter = () => {
    setActiveFilter(null);
    const params = new URLSearchParams(searchParams);
    params.delete("filterColumn");
    params.delete("filterOperator");
    params.delete("filterValue");
    if (activeSort) {
      params.set("sortColumn", activeSort.column);
      params.set("sortDirection", activeSort.direction);
    }
    router.push(`/${currentSchema}/${currentTable}?${params.toString()}`);
  };

  const handleDeleteRows = async (ids: string[]) => {
    const result = await deleteRecords(currentSchema, currentTable!, ids);
    if (!result.success) {
      throw new Error(result.error);
    }
    setSelectedRows([]);
  };

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedRows(selectedIds);
    if (selectedIds.length === 1) {
      const selected = data.find(
        (row) => row.id && String(row.id) === selectedIds[0]
      );
      setSelectedRow(selected || null);
    } else {
      setSelectedRow(null);
    }
  };

  const handleEdit = (row: TableRow) => {
    setSelectedRow(row);
    setIsEditOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedRow?.id) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No record selected for update",
      });
      return;
    }

    try {
      // Transform the selectedRow to RecordValues before passing to updateRecord
      const recordValues = transformToRecordValues(selectedRow);

      const result = await updateRecord(
        currentSchema,
        currentTable!,
        selectedRow.id,
        recordValues
      );

      if (result.success) {
        toast({
          title: "Record updated successfully",
          description: "The changes have been saved.",
        });
        setIsEditOpen(false);
        handleRefresh();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to update record",
          description: result.error || "An unknown error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to update record",
      });
    }
  };

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      <Sidebar
        currentSchema={currentSchema}
        currentTable={currentTable}
        schemas={schemas}
        tables={tables}
        onSchemaChange={(schema) => router.push(`/${schema}`)}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        {currentTable ? (
          <>
            <div className="flex-none">
              <Toolbar
                columns={columns}
                onSort={handleSort}
                activeSort={activeSort}
                onClearSort={handleClearSort}
                onFilter={handleFilter}
                activeFilter={activeFilter}
                onClearFilter={handleClearFilter}
                onRefresh={handleRefresh}
                selectedRows={selectedRows}
                onDeleteRows={handleDeleteRows}
                onEdit={handleEdit}
                selectedRow={selectedRow}
              />
            </div>
            <div className="flex-1 overflow-hidden">
              <DataTable
                columns={columns}
                data={data}
                onSelectionChange={handleSelectionChange}
              />
            </div>
            <div className="flex-none">
              <Footer
                totalRecords={totalRecords}
                page={pageFromUrl}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                onPageSizeChange={() => {}}
                onRefresh={handleRefresh}
                activeTab={activeTab}
                onTabChange={setActiveTab}
              />
            </div>

            <Sheet open={isEditOpen} onOpenChange={setIsEditOpen}>
              <SheetContent className="sm:max-w-xl overflow-hidden flex flex-col">
                <SheetHeader className="flex-none">
                  <div className="space-y-1">
                    <SheetTitle className="text-lg font-semibold">
                      Edit Record
                    </SheetTitle>
                    <p className="text-sm text-muted-foreground">
                      Update the values for this record
                    </p>
                  </div>
                  <Separator className="my-4" />
                </SheetHeader>

                <div className="flex-1 overflow-hidden">
                  <InsertRecordView
                    columns={columns}
                    initialValues={
                      selectedRow
                        ? transformToRecordValues(selectedRow)
                        : undefined
                    }
                    onValuesChange={(values) => {
                      // Transform back to TableRow to maintain id field
                      setSelectedRow({ ...selectedRow, ...values });
                    }}
                  />
                </div>

                <div className="flex-none mt-6 border-t pt-4">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsEditOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      size="sm"
                      onClick={handleUpdate}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      Update Record
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </>
        ) : (
          <div className="flex items-center justify-center h-full">
            <p className="text-muted-foreground">
              Select a table to view its data
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
