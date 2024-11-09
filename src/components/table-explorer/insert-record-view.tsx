import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";

type DatabaseValue = string | number | boolean | null | Date;

type TableColumn = {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
};

type RecordValues = Record<string, DatabaseValue>;

interface InsertRecordViewProps {
  columns: TableColumn[];
  onValuesChange: (values: RecordValues) => void;
  initialValues?: RecordValues;
}

export function InsertRecordView({
  columns,
  onValuesChange,
  initialValues = {},
}: InsertRecordViewProps) {
  const [values, setValues] = useState<RecordValues>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues(initialValues);
    onValuesChange(initialValues);
  }, [initialValues, onValuesChange]);

  const validateField = (column: TableColumn, value: DatabaseValue): string => {
    if (!column.is_nullable && value === "") {
      return `${column.column_name} is required`;
    }

    const dataType = column.data_type.toLowerCase();
    if (value) {
      if (
        (dataType === "integer" || dataType === "bigint") &&
        !/^\d+$/.test(String(value))
      ) {
        return "Must be a valid number";
      }
      if (dataType === "numeric" && !/^\d*\.?\d*$/.test(String(value))) {
        return "Must be a valid decimal number";
      }
    }
    return "";
  };

  const handleValueChange = (column: TableColumn, value: DatabaseValue) => {
    const error = validateField(column, value);
    setErrors((prev) => ({
      ...prev,
      [column.column_name]: error,
    }));

    const newValues = { ...values };
    if (value === "") {
      delete newValues[column.column_name];
    } else {
      newValues[column.column_name] = value;
    }
    setValues(newValues);
    onValuesChange(newValues);
  };

  const renderInput = (column: TableColumn) => {
    const dataType = column.data_type.toLowerCase();
    const error = errors[column.column_name];
    const defaultValue = column.column_default
      ? `Default: ${column.column_default}`
      : undefined;

    switch (dataType) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={column.column_name}
              checked={(values[column.column_name] as boolean) ?? false}
              onCheckedChange={(checked) => handleValueChange(column, checked)}
            />
            <Label htmlFor={column.column_name}>
              {values[column.column_name] ? "True" : "False"}
            </Label>
          </div>
        );
      case "integer":
      case "bigint":
      case "numeric":
        return (
          <div className="space-y-1">
            <Input
              type="text"
              placeholder={defaultValue || `Enter ${column.column_name}`}
              value={String(values[column.column_name] || "")}
              onChange={(e) => handleValueChange(column, e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      case "timestamp":
      case "date":
        return (
          <div className="space-y-1">
            <Input
              type="datetime-local"
              value={String(values[column.column_name] || "")}
              onChange={(e) => handleValueChange(column, e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
      default:
        return (
          <div className="space-y-1">
            <Input
              placeholder={defaultValue || `Enter ${column.column_name}`}
              value={String(values[column.column_name] || "")}
              onChange={(e) => handleValueChange(column, e.target.value)}
              className={error ? "border-red-500" : ""}
            />
            {error && <p className="text-xs text-red-500">{error}</p>}
          </div>
        );
    }
  };

  return (
    <ScrollArea className="h-[calc(100vh-150px)]">
      <div className="space-y-3 pr-4">
        {columns.map((column) => (
          <div
            key={column.column_name}
            className="rounded-lg border bg-card p-3 space-y-1.5 text-card-foreground"
          >
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-muted-foreground">
                {column.column_name}
              </div>
              <div className="flex items-center gap-2">
                {column.is_nullable === "YES" && (
                  <Badge variant="outline" className="text-xs">
                    nullable
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  {column.data_type}
                </Badge>
              </div>
            </div>
            <div>{renderInput(column)}</div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
}
