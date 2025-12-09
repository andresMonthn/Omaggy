import { Database } from '@kit/supabase/database';

/** Tipado de cambios. Función: Modela payload de cambios (INSERT/UPDATE/DELETE) de tablas públicas para webhooks. */

export type Tables = Database['public']['Tables'];

export type TableChangeType = 'INSERT' | 'UPDATE' | 'DELETE';

export interface RecordChange<
  Table extends keyof Tables,
  Row = Tables[Table]['Row'],
> {
  type: TableChangeType;
  table: Table;
  record: Row;
  schema: 'public';
  old_record: null | Row;
}
