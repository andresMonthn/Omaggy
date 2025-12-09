'use client';

/**  Notificaciones pacientes. Función: Suscribe a cambios en `pacientes` y `notifications`, muestra tarjetas y hace polling si no hay realtime. */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { getSupabaseBrowserClient } from '@kit/supabase/browser-client';
import { X } from 'lucide-react';

interface Paciente {
  id: string;
  user_id: string;
  nombre: string | null;
  apellido?: string | null;
  edad?: number | null;
  fecha_de_cita: string | null;
  updated_at: string;
  created_at: string;
}

export function PacientesRealtimeNotifications(props: { userId: string; accountId: string }) {
  const supabase = getSupabaseBrowserClient();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [detalles, setDetalles] = useState<Paciente[]>([]);
  const [notifs, setNotifs] = useState<Array<{ id: number; body: string }>>([]);
  const [hasRealtimeActivity, setHasRealtimeActivity] = useState(false);
  const [pollingRef, setPollingRef] = useState<ReturnType<typeof setInterval> | null>(null);

  const [closedNotifications, setClosedNotifications] = useState<string[]>([]);

  const formatearFecha = useCallback((fechaStr: string | null) => {
    if (!fechaStr) return 'Fecha no disponible';
    try {
      const fecha = new Date(fechaStr);
      return new Intl.DateTimeFormat('es', { dateStyle: 'long' }).format(fecha);
    } catch {
      return 'Fecha no disponible';
    }
  }, []);

  const closeNotification = useCallback(
    (paciente: Paciente) => {
      setPacientes((prev) => prev.filter((p) => p.id !== paciente.id));
      setDetalles((prev) => prev.filter((p) => p.id !== paciente.id));
      setClosedNotifications((prev) => (prev.includes(paciente.id) ? prev : [...prev, paciente.id]));
    },
    [],
  );

  const fetchPacientes = useCallback(async () => {
    try {
      if (!props.accountId) return;
      const { data: pacientesData, error } = await supabase
        .from('notifications')
        .select('id, body, dismissed')
        .eq('account_id', props.accountId)
        .eq('dismissed', false);
      if (error) return;
      const lista = (pacientesData as unknown as { id: number; body: string }[]) || [];
      setNotifs(lista);
    } catch {}
  }, [supabase, props.accountId]);

  const fetchPacientesDetalles = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pacientes')
        .select('id, user_id, nombre, edad, fecha_de_cita, updated_at, created_at')
        .eq('user_id', props.userId)
      if (error) return;
      const lista = (data as unknown as Paciente[]) || [];
      setDetalles(lista);
    } catch {}
  }, [supabase, props.userId]);

  useEffect(() => {
    void fetchPacientes();
    void fetchPacientesDetalles();
    const channel = supabase
      .channel('pacientes-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pacientes', filter: `user_id=eq.${props.userId}` },
        (payload) => {
          try {
            const row: any = (payload as any).new ?? (payload as any).old ?? null;
            if (!row) {
              void fetchPacientes();
              void fetchPacientesDetalles();
              setHasRealtimeActivity(true);
              return;
            }

            if ((payload as any).eventType === 'DELETE') {
              setPacientes((prev) => prev.filter((p) => p.id !== row.id));
              setDetalles((prev) => prev.filter((p) => p.id !== row.id));
              setHasRealtimeActivity(true);
              return;
            }

            if ((payload as any).eventType === 'INSERT' || (payload as any).eventType === 'UPDATE') {

              const next: Paciente = {
                id: row.id,
                user_id: row.user_id,
                nombre: row.nombre ?? null,
                apellido: row.apellido ?? null,
                edad: row.edad ?? null,
                fecha_de_cita: row.fecha_de_cita ?? null,
                updated_at: row.updated_at,
                created_at: row.created_at,
              };

              setPacientes((prev) => {
                const idx = prev.findIndex((p) => p.id === next.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = next;
                  return copy;
                }
                return [next, ...prev];
              });
              setDetalles((prev) => {
                const idx = prev.findIndex((p) => p.id === next.id);
                if (idx >= 0) {
                  const copy = [...prev];
                  copy[idx] = next;
                  return copy;
                }
                return [next, ...prev];
              });
              setHasRealtimeActivity(true);
            }
          } catch {
            void fetchPacientes();
            void fetchPacientesDetalles();
            setHasRealtimeActivity(true);
          }
        },
      )
      .subscribe();

    const notifChannel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications', filter: `account_id=eq.${props.accountId}` },
        () => {
          void fetchPacientes();
          void fetchPacientesDetalles();
          setHasRealtimeActivity(true);
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(notifChannel);
    };
  }, [supabase, fetchPacientes, fetchPacientesDetalles, closedNotifications, props.userId, props.accountId]);

  useEffect(() => {
    if (hasRealtimeActivity) {
      if (pollingRef) {
        clearInterval(pollingRef);
        setPollingRef(null);
      }
      return;
    }

    const timeout = setTimeout(() => {
      if (!hasRealtimeActivity && !pollingRef) {
        const ref = setInterval(() => {
          void fetchPacientes();
          void fetchPacientesDetalles();
        }, 2000);
        setPollingRef(ref);
      }
    }, 3000);

    return () => {
      clearTimeout(timeout);
      if (pollingRef) {
        clearInterval(pollingRef);
        setPollingRef(null);
      }
    };
  }, [hasRealtimeActivity, pollingRef, fetchPacientes]);

  const containerStyle = useMemo(
    () => ({
      position: 'fixed',
      top: '4.5rem',
      right: '1rem',
      maxWidth: '350px',
      maxHeight: '70vh',
      overflowY: 'auto',
      zIndex: 1000,
    }) as React.CSSProperties,
    [],
  );

  const autoDismissTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const visibleIdsRef = useRef<Set<string>>(new Set());
  const audioCtxRef = useRef<any>(null);
  const playNotificationSound = useCallback(() => {
    try {
      const AC = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!AC) return;
      const ctx = audioCtxRef.current ?? new AC();
      audioCtxRef.current = ctx;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.2);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch {}
  }, []);

  const detallesFiltrados: Paciente[] = useMemo(() => {
    if (!notifs.length) return [];
    const names = notifs.map((n) => (n.body ?? '').toLowerCase().trim());
    return detalles.filter((p: Paciente) => {
      const full = `${p.nombre ?? ''} ${p.apellido ?? ''}`.toLowerCase().trim();
      const matches = names.some((b: string) => full.includes(b) || b.includes(full));
      if (!matches) return false;
      if (closedNotifications.includes(p.id)) return false;
      return true;
    });
  }, [detalles, notifs, closedNotifications]);

  useEffect(() => {
    const current = new Set(detallesFiltrados.map((p) => p.id));
    let added = false;
    current.forEach((id) => {
      if (!visibleIdsRef.current.has(id)) {
        added = true;
      }
    });
    visibleIdsRef.current = current;
    if (added) {
      playNotificationSound();
    }
  }, [detallesFiltrados, playNotificationSound]);

  useEffect(() => {
    detallesFiltrados.forEach((p) => {
      if (!autoDismissTimers.current.has(p.id)) {
        const t = setTimeout(() => {
          void closeNotification(p);
          autoDismissTimers.current.delete(p.id);
        }, 7000);
        autoDismissTimers.current.set(p.id, t);
      }
    });

    autoDismissTimers.current.forEach((t, id) => {
      const present = detallesFiltrados.find((x) => x.id === id);
      if (!present) {
        clearTimeout(t);
        autoDismissTimers.current.delete(id);
      }
    });
  }, [detallesFiltrados, closeNotification]);

  return (
    <>
      {notifs.length > 0 && detallesFiltrados.length > 0 && (
        <div style={containerStyle} className="space-y-2">
          {detallesFiltrados.map((p: Paciente) => (
            <Card key={p.id} className="shadow-md bg-sky-100">
              <CardContent className="p-3 flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">Cita</Badge>
                    <span className="text-sm font-medium">{p.nombre ?? ''} {p.apellido ?? ''}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatearFecha(p.fecha_de_cita)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {p.edad ? `${p.edad} años` : ''}
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => closeNotification(p)}>
                  <X className="h-3 w-3" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
