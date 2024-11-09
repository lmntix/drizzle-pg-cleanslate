export type DatabaseValue = string | number | boolean | null | Date;

export type TableColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
};

export type TableRow = {
  id?: string; // Make id optional
  [key: string]: DatabaseValue | undefined; // Allow undefined for optional fields
};

export type RecordValues = Record<string, DatabaseValue>;
