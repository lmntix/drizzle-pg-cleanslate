"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

interface SidebarProps {
  currentSchema: string;
  currentTable?: string;
  schemas: string[];
  tables: string[];
  onSchemaChange: (schema: string) => void;
}

export function Sidebar({
  currentSchema,
  currentTable,
  schemas,
  tables,
  onSchemaChange,
}: SidebarProps) {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredTables = tables.filter((table) =>
    table.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="w-64 border-r border-border p-4 flex flex-col">
      <div className="space-y-2">
        <Select value={currentSchema} onValueChange={onSchemaChange}>
          <SelectTrigger>
            <span className="text-muted-foreground">schema: </span>
            <SelectValue placeholder="Select schema" />
          </SelectTrigger>
          <SelectContent>
            {schemas.map((schema) => (
              <SelectItem key={schema} value={schema}>
                {schema}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tables..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8"
          />
        </div>

        <ScrollArea className="h-[calc(100vh-200px)]">
          <div className="space-y-1">
            {filteredTables.map((table) => (
              <Link key={table} href={`/${currentSchema}/${table}`}>
                <Button
                  variant={currentTable === table ? "secondary" : "ghost"}
                  className={`w-full justify-start transition-colors ${
                    currentTable === table
                      ? ""
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="flex items-center">
                    <Table className="mr-2 h-4 w-4" />
                    {table}
                  </div>
                </Button>
              </Link>
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
