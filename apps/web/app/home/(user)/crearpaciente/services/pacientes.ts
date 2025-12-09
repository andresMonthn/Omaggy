import { PacienteInsertPayload } from '../types';

export async function insertPacienteOnline(supabase: any, payload: PacienteInsertPayload) {
  const { data, error } = await (supabase.from('pacientes' as any) as any).insert([payload]);
  if (error) throw error;
  return data;
}

export async function insertPacienteOffline(pacientesDB: any, payload: PacienteInsertPayload) {
  await pacientesDB.add(payload);
}
