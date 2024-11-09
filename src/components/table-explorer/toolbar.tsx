import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc, X, Plus, Trash2, Edit } from "lucide-react";
import ThemeToggle from "../theme-toggle";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { InsertRecordView } from "./insert-record-view";
import { usePathname } from "next/navigation";
import { insertRecord } from "@/app/actions";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TableColumn, TableRow, RecordValues } from "@/types/database";

interface ToolbarProps {
  columns: TableColumn[];
  onSort: (column: string, direction: "asc" | "desc") => void;
  activeSort?: { column: string; direction: "asc" | "desc" } | null;
  onClearSort: () => void;
  onFilter: (column: string, operator: string, value: string) => void;
  activeFilter?: { column: string; operator: string; value: string } | null;
  onClearFilter: () => void;
  onRefresh?: () => void;
  selectedRows: string[];
  onDeleteRows: (ids: string[]) => Promise<void>;
  onEdit?: (row: TableRow) => void;
  selectedRow?: TableRow | null;
}

const FILTER_OPERATORS = {
  text: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "not equals" },
    { value: "contains", label: "contains" },
    { value: "starts_with", label: "starts with" },
    { value: "ends_with", label: "ends with" },
  ],
  numeric: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "not equals" },
    { value: "gt", label: "greater than" },
    { value: "gte", label: "greater than or equal" },
    { value: "lt", label: "less than" },
    { value: "lte", label: "less than or equal" },
  ],
  boolean: [
    { value: "eq", label: "equals" },
    { value: "neq", label: "not equals" },
  ],
};

export function Toolbar({
  columns,
  onSort,
  activeSort,
  onClearSort,
  onFilter,
  activeFilter,
  onClearFilter,
  onRefresh,
  selectedRows,
  onDeleteRows,
  onEdit,
  selectedRow,
}: ToolbarProps) {
  const [selectedColumn, setSelectedColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Filter states
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterOperator, setFilterOperator] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");

  const [isInsertOpen, setIsInsertOpen] = useState(false);
  const [insertValues, setInsertValues] = useState<RecordValues>({});

  const { toast } = useToast();
  const pathname = usePathname();
  const [schema, table] = pathname.split("/").filter(Boolean);

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const handleInsertValuesChange = (values: RecordValues) => {
    setInsertValues(values);
  };

  const handleApplySort = () => {
    if (selectedColumn) {
      onSort(selectedColumn, sortDirection);
      setIsSortOpen(false);
    }
  };

  const handleApplyFilter = () => {
    if (filterColumn && filterOperator && filterValue) {
      onFilter(filterColumn, filterOperator, filterValue);
      setIsFilterOpen(false);
    }
  };

  const getOperatorsForColumn = (columnName: string) => {
    const column = columns.find(
      (col: TableColumn) => col.column_name === columnName
    );
    if (!column) return FILTER_OPERATORS.text;

    const dataType = column.data_type.toLowerCase();
    if (dataType === "boolean") return FILTER_OPERATORS.boolean;
    if (["integer", "bigint", "numeric", "decimal"].includes(dataType)) {
      return FILTER_OPERATORS.numeric;
    }
    return FILTER_OPERATORS.text;
  };

  const handleInsert = async () => {
    try {
      const result = await insertRecord(schema, table, insertValues);

      if (result.success) {
        toast({
          title: "Record inserted successfully",
          description: "The new record has been added to the table.",
        });
        setIsInsertOpen(false);
        onRefresh?.();
      } else {
        toast({
          variant: "destructive",
          title: "Failed to insert record",
          description: result.error || "An unknown error occurred",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to insert record",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await onDeleteRows(selectedRows);
      setShowDeleteDialog(false);
      toast({
        title: "Records deleted successfully",
        description: `${selectedRows.length} record(s) have been deleted.`,
      });
      onRefresh?.();
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error deleting records",
        description:
          error instanceof Error ? error.message : "Failed to delete records",
      });
    }
  };

  return (
    <div className="border-b border-border p-2 flex flex-col sm:flex-row sm:flex-wrap gap-4 items-start sm:items-center justify-between">
      <div className="flex flex-wrap items-center gap-2">
        {selectedRows.length === 1 && selectedRow && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onEdit?.(selectedRow)}
          >
            <Edit className="mr-2 h-4 w-4" />
            View/Edit
          </Button>
        )}
        {selectedRows.length > 0 && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete ({selectedRows.length})
          </Button>
        )}
        {/* Filter Button and Popover */}
        <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={activeFilter ? "secondary" : "outline"}
              size="sm"
              className="relative"
            >
              <Filter className="mr-2 h-4 w-4" />
              Filter
              {activeFilter && (
                <Badge variant="secondary" className="ml-2 bg-muted">
                  {activeFilter.column} {activeFilter.operator}{" "}
                  {activeFilter.value}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Filter by</h4>
                <Select value={filterColumn} onValueChange={setFilterColumn}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column: TableColumn) => (
                      <SelectItem
                        key={column.column_name}
                        value={column.column_name}
                      >
                        {column.column_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {filterColumn && (
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Operator</h4>
                  <Select
                    value={filterOperator}
                    onValueChange={setFilterOperator}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select operator" />
                    </SelectTrigger>
                    <SelectContent>
                      {getOperatorsForColumn(filterColumn).map((op) => (
                        <SelectItem key={op.value} value={op.value}>
                          {op.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {filterColumn && filterOperator && (
                <div className="space-y-2">
                  <h4 className="font-medium leading-none">Value</h4>
                  <Input
                    placeholder="Enter value"
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                  />
                </div>
              )}

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFilterOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplyFilter}
                  disabled={!filterColumn || !filterOperator || !filterValue}
                >
                  Apply Filter
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeFilter && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearFilter}
            className="text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Filter
          </Button>
        )}

        {/* Existing Sort Button and Popover */}
        <Popover open={isSortOpen} onOpenChange={setIsSortOpen}>
          <PopoverTrigger asChild>
            <Button
              variant={activeSort ? "secondary" : "outline"}
              size="sm"
              className="relative"
            >
              <SortAsc className="mr-2 h-4 w-4" />
              Sort
              {activeSort && (
                <Badge variant="secondary" className="ml-2 bg-muted">
                  {activeSort.column} ({activeSort.direction})
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Sort by</h4>
                <Select
                  value={selectedColumn}
                  onValueChange={setSelectedColumn}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select column" />
                  </SelectTrigger>
                  <SelectContent>
                    {columns.map((column: TableColumn) => (
                      <SelectItem
                        key={column.column_name}
                        value={column.column_name}
                      >
                        {column.column_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium leading-none">Direction</h4>
                <Select
                  value={sortDirection}
                  onValueChange={(value: "asc" | "desc") =>
                    setSortDirection(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asc">Ascending</SelectItem>
                    <SelectItem value="desc">Descending</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsSortOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleApplySort}
                  disabled={!selectedColumn}
                >
                  Apply Sort
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {activeSort && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSort}
            className="text-muted-foreground"
          >
            <X className="mr-2 h-4 w-4" />
            Clear Sort
          </Button>
        )}

        <Sheet open={isInsertOpen} onOpenChange={setIsInsertOpen}>
          <SheetTrigger asChild>
            <Button variant="secondary" size="sm">
              <Plus className=" h-4 w-4" />
              Insert
            </Button>
          </SheetTrigger>
          <SheetContent className="sm:max-w-xl overflow-hidden flex flex-col">
            <SheetHeader className="flex-none">
              <div className="space-y-1">
                <SheetTitle className="text-lg font-semibold">
                  Insert New Record
                </SheetTitle>
                <p className="text-sm text-muted-foreground">
                  Fill in the values for the new record
                </p>
              </div>
              <Separator className="my-4" />
            </SheetHeader>

            <div className="flex-1 overflow-hidden">
              <InsertRecordView
                columns={columns}
                onValuesChange={handleInsertValuesChange}
              />
            </div>

            <div className="flex-none mt-6 border-t pt-4">
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsInsertOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  onClick={handleInsert}
                  className="bg-emerald-600 hover:bg-emerald-700"
                >
                  Insert Record
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Badge
          variant="secondary"
          className="bg-orange-900/20 text-orange-400 hover:bg-orange-900/20"
        >
          RLS disabled
        </Badge>
        <div className="flex items-center space-x-2 px-4 py-1 rounded-md bg-muted">
          <span className="text-sm text-muted-foreground">role:</span>
          <span className="text-sm">postgres</span>
        </div>
        <Badge variant="outline">Realtime off</Badge>
        <ThemeToggle />
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete{" "}
              {selectedRows.length} selected record(s).
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
