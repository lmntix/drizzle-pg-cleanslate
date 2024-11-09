import {
  getSchemas,
  getTables,
  getTableColumns,
  getTableData,
  getTableCount,
} from "@/app/actions";
import TableExplorer from "@/components/table-explorer";
import { redirect } from "next/navigation";
import { TableRow } from "@/types/database";
import { Suspense } from "react";

interface TablePageProps {
  params: { schema: string; table: string };
  searchParams: {
    page?: string;
    sortColumn?: string;
    sortDirection?: "asc" | "desc";
    filterColumn?: string;
    filterOperator?: string;
    filterValue?: string;
  };
}

export default async function TablePage({
  params,
  searchParams,
}: TablePageProps) {
  const page = Number(searchParams.page) || 1;
  const pageSize = 100;

  const sort =
    searchParams.sortColumn && searchParams.sortDirection
      ? {
          column: searchParams.sortColumn,
          direction: searchParams.sortDirection,
        }
      : undefined;

  const filter =
    searchParams.filterColumn &&
    searchParams.filterOperator &&
    searchParams.filterValue
      ? {
          column: searchParams.filterColumn,
          operator: searchParams.filterOperator,
          value: searchParams.filterValue,
        }
      : undefined;

  try {
    const [schemas, tables, columns, totalRecords, rawData] = await Promise.all(
      [
        getSchemas(),
        getTables(params.schema),
        getTableColumns(params.schema, params.table),
        getTableCount(params.schema, params.table, filter),
        getTableData(params.schema, params.table, page, pageSize, sort, filter),
      ]
    );

    // Transform the raw data to match TableRow type
    const data: TableRow[] = rawData.map((row: Record<string, unknown>) => {
      const transformedRow: Record<string, unknown> = {};

      // Transform each value to ensure it matches DatabaseValue type
      Object.entries(row).forEach(([key, value]) => {
        if (
          value === null ||
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean" ||
          value instanceof Date
        ) {
          transformedRow[key] = value;
        } else {
          // For any other types, convert to string
          transformedRow[key] = String(value);
        }
      });

      return transformedRow as TableRow;
    });

    return (
      <Suspense fallback={<div>Loading...</div>}>
        <TableExplorer
          currentSchema={params.schema}
          currentTable={params.table}
          schemas={schemas.map((s) => s.schema_name)}
          tables={tables.map((t) => t.table_name)}
          columns={columns}
          data={data}
          totalRecords={totalRecords}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error in TablePage:", error);
    redirect("/");
  }
}

export async function generateStaticParams() {
  try {
    const schemas = await getSchemas();
    const allParams = await Promise.all(
      schemas.map(async (schema) => {
        const tables = await getTables(schema.schema_name);
        return tables.map((table) => ({
          schema: schema.schema_name,
          table: table.table_name,
        }));
      })
    );
    return allParams.flat();
  } catch (error) {
    console.error("Error in generateStaticParams:", error);
    return [];
  }
}
