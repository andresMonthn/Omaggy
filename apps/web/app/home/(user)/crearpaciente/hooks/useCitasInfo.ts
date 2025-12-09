import { useEffect, useState } from 'react';
import { CitaInfo } from '../types';

export function useCitasInfo(isOnline: boolean, supabase: any, pacientesDB: any, userId: string | null) {
  const [citasInfo, setCitasInfo] = useState<CitaInfo[]>([]);
  const [cargandoCitas, setCargandoCitas] = useState(false);

  useEffect(() => {
    const fetchCitas = async () => {
      if (!userId) return;
      setCargandoCitas(true);
      try {
        const citasPorFecha = new Map<string, number>();
        if (isOnline) {
          const { data, error } = await supabase
            .from('pacientes' as any)
            .select('fecha_de_cita')
            .eq('user_id', userId)
            .not('fecha_de_cita', 'is', null);
          if (!error) {
            const pacientes = (data as any[]) || [];
            pacientes.forEach((paciente) => {
              const v = paciente?.fecha_de_cita ? String(paciente.fecha_de_cita) : null;
              if (v) {
                const fecha = v.split('T')[0];
                if (fecha) {
                  citasPorFecha.set(fecha, (citasPorFecha.get(fecha) || 0) + 1);
                }
              }
            });
          }
        } else {
          const locales = await pacientesDB.list();
          locales.forEach((p: any) => {
            const v = p?.fecha_de_cita ? String(p.fecha_de_cita) : null;
            if (v) {
              const fecha = v.split('T')[0];
              if (fecha) {
                citasPorFecha.set(fecha, (citasPorFecha.get(fecha) || 0) + 1);
              }
            }
          });
        }
        const info: CitaInfo[] = Array.from(citasPorFecha.entries()).map(([fechaStr, cantidad]) => ({
          fecha: new Date(fechaStr),
          cantidadPacientes: cantidad,
        }));
        setCitasInfo(info);
      } finally {
        setCargandoCitas(false);
      }
    };
    fetchCitas();
  }, [isOnline, supabase, pacientesDB, userId]);

  return { citasInfo, cargandoCitas };
}
