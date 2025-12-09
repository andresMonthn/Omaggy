import { format, startOfDay } from 'date-fns';
import { DomicilioCompleto } from '../types';

export function parseTruthy(val: any): boolean {
  if (typeof val === 'boolean') return val;
  const s = String(val).trim().toLowerCase();
  return s === 'true' || s === '1' || s === 'si' || s === 'sí' || s === 'yes';
}

export function parseDate(val: any): Date | null {
  try {
    if (val instanceof Date) return val;
    const s = String(val).trim();
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

export function formatFechaNacimiento(fecha: Date | string | null): string | null {
  if (!fecha) return null;
  const d = typeof fecha === 'string' ? new Date(fecha) : fecha;
  return format(d, 'yyyy-MM-dd');
}

export function buildDomicilio(
  domicilioCompleto: boolean,
  fields: DomicilioCompleto,
  simple: string
): string {
  if (!domicilioCompleto) return simple;
  const interior = fields.interior ? `, Int. ${fields.interior}` : '';
  return `${fields.calle} ${fields.numero}${interior}, Col. ${fields.colonia}`;
}

export function calcEstadoByFechaCita(fechaCita: Date): string {
  const hoy = startOfDay(new Date());
  const fc = startOfDay(fechaCita);
  if (fc.getTime() === hoy.getTime()) return 'PENDIENTE';
  if (fc.getTime() > hoy.getTime()) return 'PROGRAMADO';
  return 'EXPIRADO';
}

export function normalizeFechaCitaISO(fechaCita: Date | undefined): string {
  const fc = startOfDay(fechaCita ? new Date(fechaCita) : new Date());
  return fc.toISOString();
}

export function joinWithOtros(
  list: string[],
  otrosLabel: string,
  otrosValor: string,
  fallback: string
): string {
  if (list.length === 0) return fallback;
  return list
    .map((v) => (v === otrosLabel ? `${otrosLabel}: ${otrosValor}` : v))
    .join(', ');
}
