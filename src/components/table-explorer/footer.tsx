import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCcw,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface FooterProps {
  totalRecords: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onRefresh: () => void;
  activeTab: "data" | "definition";
  onTabChange: (tab: "data" | "definition") => void;
}

export function Footer({
  totalRecords,
  page,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onRefresh,
  activeTab,
  onTabChange,
}: FooterProps) {
  const totalPages = Math.ceil(totalRecords / pageSize);

  return (
    <div className="border-t border-border p-2 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="flex items-center gap-2 min-w-0">
        {activeTab === "data" && (
          <>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onPageChange(page - 1)}
                disabled={page <= 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="shrink-0"
                onClick={() => onPageChange(page + 1)}
                disabled={page >= totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <span className="text-sm text-muted-foreground shrink-0">
              Page {page} of {totalPages}
            </span>
            <Select
              value={pageSize.toString()}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[100px] shrink-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">100 rows</SelectItem>
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground whitespace-nowrap shrink-0">
              {totalRecords.toLocaleString()} records
            </span>
          </>
        )}
      </div>
      <div className="flex items-center gap-2 md:justify-end">
        <Button
          variant="outline"
          size="sm"
          className="shrink-0"
          onClick={onRefresh}
        >
          <RefreshCcw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
        <Tabs
          value={activeTab}
          onValueChange={(value) => onTabChange(value as "data" | "definition")}
          className="shrink-0"
        >
          <TabsList>
            <TabsTrigger value="data">Data</TabsTrigger>
            <TabsTrigger value="definition">Definition</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </div>
  );
}
