"use client";

type TableColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
};

interface TableDefinitionProps {
  schema: string;
  table: string;
  columns: TableColumn[];
}

export function TableDefinition({
  schema,
  table,
  columns,
}: TableDefinitionProps) {
  return (
    <div className="p-4 space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-medium">Table Definition</h3>
        <p className="text-sm text-muted-foreground">
          {schema}.{table}
        </p>
      </div>

      <div className="border rounded-md">
        <div className="grid grid-cols-4 gap-4 p-4 border-b bg-muted text-sm font-medium">
          <div>Column</div>
          <div>Type</div>
          <div>Nullable</div>
          <div>Default</div>
        </div>
        <div className="divide-y">
          {columns.map((column) => (
            <div
              key={column.column_name}
              className="grid grid-cols-4 gap-4 p-4 text-sm"
            >
              <div>{column.column_name}</div>
              <div>{column.data_type}</div>
              <div>{column.is_nullable === "YES" ? "Yes" : "No"}</div>
              <div>{column.column_default || "-"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
