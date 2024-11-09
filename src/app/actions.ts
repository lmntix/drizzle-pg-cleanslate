"use server";

import { db } from "@/db";
import { sql } from "drizzle-orm";
import { DatabaseValue, RecordValues } from "@/types/database";

interface InsertResult {
  success: boolean;
  data?: RecordValues;
  error?: string;
}

interface UpdateResult {
  success: boolean;
  data?: RecordValues;
  error?: string;
}

interface DeleteResult {
  success: boolean;
  error?: string;
}

// Helper function to transform unknown values to DatabaseValue
function transformToDatabaseValue(value: unknown): DatabaseValue {
  if (
    value === null ||
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value as DatabaseValue;
  }
  // Convert any other types to string
  return String(value);
}

// Helper function to transform record
function transformRecord(record: Record<string, unknown>): RecordValues {
  const transformed: RecordValues = {};
  for (const [key, value] of Object.entries(record)) {
    transformed[key] = transformToDatabaseValue(value);
  }
  return transformed;
}

export async function getSchemas() {
  try {
    const result = await db.execute<{ schema_name: string }>(sql`
        SELECT schema_name 
        FROM information_schema.schemata
        WHERE schema_name NOT IN (
          'information_schema', 
          'pg_catalog', 
          'pg_toast', 
          'pg_temp_1', 
          'pg_toast_temp_1'
        )
        AND schema_name NOT LIKE 'pg_%'
        ORDER BY schema_name
      `);
    return result;
  } catch (error) {
    console.error("Error fetching schemas:", error);
    throw error;
  }
}

export async function getTables(schema: string) {
  const result = await db.execute<{ table_name: string }>(sql`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = ${schema}
    AND table_type = 'BASE TABLE'
  `);
  return result;
}

export async function getTableColumns(schema: string, table: string) {
  const result = await db.execute<{
    column_name: string;
    data_type: string;
    is_nullable: string;
  }>(sql`
    SELECT column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = ${schema}
    AND table_name = ${table}
    ORDER BY ordinal_position
  `);
  return result;
}

export async function getTableData(
  schema: string,
  table: string,
  page = 1,
  pageSize = 100,
  sort?: { column: string; direction: "asc" | "desc" },
  filter?: { column: string; operator: string; value: string }
) {
  const offset = (page - 1) * pageSize;
  try {
    console.log(`Attempting to query table: ${schema}.${table}`);

    const orderClause = sort
      ? sql`ORDER BY ${sql.identifier(sort.column)} ${sql.raw(sort.direction)}`
      : sql`ORDER BY id DESC`;

    let whereClause = sql``;
    if (filter) {
      const { column, operator, value } = filter;
      whereClause = sql`WHERE `;

      switch (operator) {
        case "eq":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} = ${value}`;
          break;
        case "neq":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} != ${value}`;
          break;
        case "contains":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} ILIKE ${`%${value}%`}`;
          break;
        case "starts_with":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} ILIKE ${`${value}%`}`;
          break;
        case "ends_with":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} ILIKE ${`%${value}`}`;
          break;
        case "gt":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} > ${value}`;
          break;
        case "gte":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} >= ${value}`;
          break;
        case "lt":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} < ${value}`;
          break;
        case "lte":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} <= ${value}`;
          break;
      }
    }

    const result = await db.execute<Record<string, unknown>>(sql`
      SELECT *
      FROM ${sql.identifier(schema)}.${sql.identifier(table)}
      ${whereClause}
      ${orderClause}
      LIMIT ${pageSize}
      OFFSET ${offset}
    `);
    return result;
  } catch (error) {
    console.error(`Error querying table ${schema}.${table}:`, error);
    throw error;
  }
}

export async function getTableCount(
  schema: string,
  table: string,
  filter?: { column: string; operator: string; value: string }
) {
  try {
    let whereClause = sql``;
    if (filter) {
      const { column, operator, value } = filter;
      whereClause = sql`WHERE `;

      switch (operator) {
        case "eq":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} = ${value}`;
          break;
        case "neq":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} != ${value}`;
          break;
        case "contains":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} ILIKE ${`%${value}%`}`;
          break;
        case "starts_with":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} ILIKE ${`${value}%`}`;
          break;
        case "ends_with":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} ILIKE ${`%${value}`}`;
          break;
        case "gt":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} > ${value}`;
          break;
        case "gte":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} >= ${value}`;
          break;
        case "lt":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} < ${value}`;
          break;
        case "lte":
          whereClause = sql`${whereClause} ${sql.identifier(
            column
          )} <= ${value}`;
          break;
      }
    }

    const result = await db.execute<{ count: number }>(sql`
      SELECT COUNT(*) as count
      FROM ${sql.identifier(schema)}.${sql.identifier(table)}
      ${whereClause}
    `);
    return Number(result[0].count);
  } catch (error) {
    console.error(`Error getting table count for ${schema}.${table}:`, error);
    throw error;
  }
}

export async function getTableDefinition(schema: string, table: string) {
  try {
    const result = await db.execute<{ definition: string }>(sql`
      SELECT pg_catalog.pg_get_tabledef(${`${schema}.${table}`}::regclass::oid) as definition;
    `);
    return result[0]?.definition || "";
  } catch (error) {
    console.error(
      `Error getting table definition for ${schema}.${table}:`,
      error
    );
    throw error;
  }
}

export async function fetchLinkedRecord(
  schema: string,
  table: string,
  column: string,
  value: string
) {
  try {
    // First get the referenced table and column
    const foreignKeyInfo = await db.execute<{
      foreign_table_schema: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(sql`
      SELECT
        cl2.relnamespace::regnamespace::text as foreign_table_schema,
        cl2.relname as foreign_table_name,
        att2.attname as foreign_column_name
      FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_class cl2 ON cl2.oid = con.confrelid
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        JOIN pg_attribute att2 ON att2.attrelid = con.confrelid AND att2.attnum = ANY(con.confkey)
      WHERE con.contype = 'f'
        AND cl.relnamespace::regnamespace::text = ${schema}
        AND cl.relname = ${table}
        AND att.attname = ${column}
    `);

    if (foreignKeyInfo.length === 0) {
      throw new Error("No foreign key relationship found");
    }

    const { foreign_table_schema, foreign_table_name, foreign_column_name } =
      foreignKeyInfo[0];

    // Then get the referenced record
    const result = await db.execute(sql`
      SELECT *
      FROM ${sql.identifier(foreign_table_schema)}.${sql.identifier(
      foreign_table_name
    )}
      WHERE ${sql.identifier(foreign_column_name)} = ${value}
      LIMIT 1
    `);

    return {
      schema: foreign_table_schema,
      table: foreign_table_name,
      data: result[0] ? transformRecord(result[0]) : null,
    };
  } catch (error) {
    console.error("Error fetching linked record:", error);
    throw error;
  }
}

export async function insertRecord(
  schema: string,
  table: string,
  values: RecordValues
): Promise<InsertResult> {
  try {
    const columns = Object.keys(values);
    const valuesArray = Object.values(values);

    const result = await db.execute(sql`
      INSERT INTO ${sql.identifier(schema)}.${sql.identifier(table)}
      (${sql.join(
        columns.map((c) => sql.identifier(c)),
        sql`, `
      )})
      VALUES (${sql.join(
        valuesArray.map((v) => sql`${v}`),
        sql`, `
      )})
      RETURNING *;
    `);

    return { success: true, data: transformRecord(result[0]) };
  } catch (error) {
    console.error("Error inserting record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to insert record",
    };
  }
}

export async function getRelatedTableData(
  schema: string,
  table: string,
  column: string,
  search?: string
) {
  try {
    // First get the referenced table info
    const foreignKeyInfo = await db.execute<{
      foreign_table_schema: string;
      foreign_table_name: string;
      foreign_column_name: string;
    }>(sql`
      SELECT
        cl2.relnamespace::regnamespace::text as foreign_table_schema,
        cl2.relname as foreign_table_name,
        att2.attname as foreign_column_name
      FROM pg_constraint con
        JOIN pg_class cl ON cl.oid = con.conrelid
        JOIN pg_class cl2 ON cl2.oid = con.confrelid
        JOIN pg_attribute att ON att.attrelid = con.conrelid AND att.attnum = ANY(con.conkey)
        JOIN pg_attribute att2 ON att2.attrelid = con.confrelid AND att2.attnum = ANY(con.confkey)
      WHERE con.contype = 'f'
        AND cl.relnamespace::regnamespace::text = ${schema}
        AND cl.relname = ${table}
        AND att.attname = ${column}
    `);

    if (foreignKeyInfo.length === 0) {
      throw new Error("No foreign key relationship found");
    }

    const { foreign_table_schema, foreign_table_name, foreign_column_name } =
      foreignKeyInfo[0];

    // Then get the data from the referenced table
    let query = sql`
      SELECT ${sql.identifier(foreign_column_name)} as value, 
             ${sql.identifier(foreign_column_name)} as label
      FROM ${sql.identifier(foreign_table_schema)}.${sql.identifier(
      foreign_table_name
    )}
    `;

    if (search) {
      query = sql`${query} WHERE ${sql.identifier(
        foreign_column_name
      )} ILIKE ${`%${search}%`}`;
    }

    query = sql`${query} LIMIT 100`;

    const result = await db.execute(query);

    return {
      schema: foreign_table_schema,
      table: foreign_table_name,
      column: foreign_column_name,
      data: result,
    };
  } catch (error) {
    console.error("Error fetching related table data:", error);
    throw error;
  }
}

export async function deleteRecords(
  schema: string,
  table: string,
  ids: string[]
): Promise<DeleteResult> {
  try {
    await db.execute(sql`
      DELETE FROM ${sql.identifier(schema)}.${sql.identifier(table)}
      WHERE id IN (${sql.join(ids, sql`, `)})
    `);
    return { success: true };
  } catch (error) {
    console.error("Error deleting records:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "Failed to delete records",
    };
  }
}

export async function updateRecord(
  schema: string,
  table: string,
  id: string | number,
  values: RecordValues
): Promise<UpdateResult> {
  try {
    const setClause = Object.entries(values)
      .filter(([key]) => key !== "id")
      .map(([key, value]) => sql`${sql.identifier(key)} = ${value}`);

    const result = await db.execute(sql`
      UPDATE ${sql.identifier(schema)}.${sql.identifier(table)}
      SET ${sql.join(setClause, sql`, `)}
      WHERE id = ${id}
      RETURNING *;
    `);

    return { success: true, data: transformRecord(result[0]) };
  } catch (error) {
    console.error("Error updating record:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update record",
    };
  }
}
