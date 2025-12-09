"use client";
/** Respuestas de respaldo. Función: Genera texto guía, sugerencias y enlaces para navegación cuando el backend no responde; incluye componente `FallbackAnswer`. */
import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent, CardFooter } from "@kit/ui/card";
import { Button } from "@kit/ui/button";
import appConfig from "~/config/app.config";
import pathsConfig from "~/config/paths.config";

type Candidate = { id: string; nombre: string };

function normalize(text: string) {
  return String(text || "").toLowerCase().normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

function answerFor(query: string) {
  const q = normalize(query);
  const intent = intentFor(q);
  const kb: Record<string, string> = {
    hola:
      "Hola. ¿En qué puedo ayudarte?",
    ayuda:
      "Funciones disponibles: pacientes, diagnósticos, recetas, órdenes RX, citas, calendario y dashboard. Puedes pedirme acciones como abrir historial o programar visita.",
    paciente:
      "Para pacientes: abre el listado en Home/View, busca por nombre o ID y entra al historial clínico para editar, imprimir o programar próxima visita.",
    pacientes:
      "Listado de pacientes: usa Home/View. Desde la tabla puedes abrir el historial, copiar ID y exportar CSV.",
    diagnostico:
      "Diagnóstico: crea o edita en el historial clínico del paciente. El diagnóstico reciente puede vincular una orden RX para imprimir.",
    diagnostico2:
      "Para diagnósticos: selecciona el paciente, añade evaluación, tratamiento y observaciones; DIP y RX final quedan disponibles para orden RX.",
    receta:
      "Recetas: se gestionan dentro del diagnóstico; puedes editar parámetros ESF, CIL, EJE y ADD por ojo y luego imprimir la orden RX.",
    recetas:
      "Recetas: consulta y edita las fórmulas de uso y final; asegúrate de tener RX final para impresión.",
    orden:
      "Orden RX: se actualiza desde el diálogo de imprimir. Usa material, tratamiento, tipo de lente y montura; se guarda en orden_rx usando el order_rx_id del diagnóstico.",
    ordenrx:
      "Impresión Orden RX: abre el diálogo desde el historial del paciente, ajusta parámetros y se actualiza la orden existente; luego imprime.",
    cita:
      "Citas: programa próxima visita desde el detalle del paciente; se actualiza proxima_visita en diagnóstico y fecha_de_cita en paciente.",
    citas:
      "Citas: consulta y programa en la vista del paciente; también puedes revisar estados en Home/View y el dashboard.",
    calendario:
      "Calendario: programa y gestiona citas; si deseas reprogramar, actualiza la próxima visita y la fecha de cita del paciente.",
    dashboard:
      "Dashboard: resumen de pacientes activos, citas pendientes y diagnósticos; acceso rápido a las funciones principales.",
    perfil:
      "Perfil: actualiza información y preferencias; revisa seguridad y sesión para evitar errores de RLS o autenticación.",
    buscar:
      "Búsqueda: usa el campo en Home/View para filtrar por nombre o exporta CSV para revisión.",
    exportar:
      "Exportar: desde Home/View usa la opción de exportar CSV para análisis o respaldo.",
    imprimir:
      "Imprimir: la orden RX se imprime desde el historial del paciente tras ajustar parámetros.",
    inventario:
      "Inventario: registra materiales, existencias y bajas; revisa movimientos y control administrativo.",
    qr:
      "Registro por QR: utiliza la sección QR para alta rápida del paciente escaneando código.",
    crearpaciente:
      "Crear paciente: completa el formulario con datos básicos y clínicos; se notifica en el Dashboard.",
    view:
      "Vista de pacientes: consulta, edita, elimina y exporta; abre historial clínico desde la tabla.",
  };
  // Primero, responder según la intención detectada, sin que "hola" u otras palabras clave lo sobreescriban
  if (intent === "crear_paciente") {
    return "Para crear un paciente: abre la sección Crear Paciente; completa nombre, edad, teléfono y datos clínicos si aplica; guarda; el paciente quedará disponible en Home/View y aparecerá en el Dashboard.";
  }
  if (intent === "qr_paciente") {
    return "Para registrar por QR: abre Registro por QR; escanea el código del paciente; verifica y completa los datos; guarda; podrás ver al paciente en Home/View y abrir su historial.";
  }
  if (intent === "orden_rx") {
    return "Para imprimir Orden RX: abre el historial del paciente; desde el diagnóstico reciente usa Imprimir Orden RX; ajusta material, tratamiento, tipo de lente y montura; guarda y procede a imprimir.";
  }
  // Si no hubo intención específica, usar el catálogo de respuestas por palabra clave
  const keys = Object.keys(kb);
  for (const k of keys) {
    const target = normalize(k);
    if (q.includes(target)) return kb[k];
  }
  if (q.includes("rx") || q.includes("orden")) return kb["ordenrx"];
  if (q.includes("diagnost") || q.includes("dip")) return kb["diagnostico2"];
  if (q.includes("pacient")) return kb["pacientes"];
  if (q.includes("cita") || q.includes("agenda")) return kb["citas"];
  return "Estoy listo. Indica tu consulta u orden.";
}

function buildSuggestions(query: string): string[] {
  const q = normalize(query);
  const s: string[] = [];
  if ((q.includes("crear") || q.includes("registr") || q.includes("cita nueva")) && q.includes("pacient")) {
    s.push("Abrir Crear Paciente para iniciar el registro.");
    s.push("Si proporcionas nombre y teléfono, los prellenaré.");
    return s;
  }
  if (q.includes("orden") || q.includes("rx")) {
    s.push("Abre el historial y usa Imprimir Orden RX.");
    s.push("Verifica que el diagnóstico reciente tenga order_rx_id.");
  }
  if (q.includes("diagnost")) {
    s.push("Edita DIP y RX final antes de imprimir.");
    s.push("Guarda observaciones y tratamiento.");
  }
  if (q.includes("pacient")) {
    s.push("Usa Home/View para buscar y abrir historial.");
    s.push("Exporta CSV si necesitas revisión masiva.");
  }
  if (q.includes("cita") || q.includes("agenda")) {
    s.push("Programa próxima visita en el detalle del paciente.");
    s.push("Actualiza estado del paciente a Completado al finalizar.");
  }
  if (!s.length) {
    s.push("Indica si necesitas pacientes, diagnósticos, recetas u órdenes RX.");
    s.push("Puedo guiarte para abrir historial o programar citas.");
  }
  return s;
}

function needsGuidance(query: string): boolean {
  const q = normalize(query);
  if (!q || q.trim().length === 0) return false;
  if (q.includes("ayuda") || q.includes("help")) return true;
  if (q.includes("como") || q.includes("cómo")) return true;
  if (q.includes("donde") || q.includes("dónde")) return true;
  if (q.includes("no encuentro") || q.includes("no se") || q.includes("no sé")) return true;
  if (q.includes("abrir") || q.includes("abre") || q.includes("navegar") || q.includes("ir a")) return true;
  if (q.includes("ver") && (q.includes("pacient") || q.includes("agenda") || q.includes("dashboard"))) return true;
  return false;
}

function intentFor(q: string): string | null {
  const hasComo = q.includes("como") || q.includes("cómo");
  if (
    (
      hasComo ||
      q.includes("crear") ||
      q.includes("registr") ||
      q.includes("alta") ||
      q.includes("cita nueva") ||
      (q.includes("ayudame") && q.includes("pacient")) ||
      (q.includes("voy a") && q.includes("registr") && q.includes("pacient"))
    ) && q.includes("pacient")
  ) {
    return "crear_paciente";
  }
  if ((hasComo || q.includes("pasar")) && q.includes("qr")) return "qr_paciente";
  if ((hasComo || q.includes("imprimir")) && (q.includes("orden") || q.includes("rx"))) return "orden_rx";
  return null;
}

export function FallbackAnswer({
  query,
  candidates,
  onOpenPaciente,
}: {
  query: string;
  candidates?: Candidate[];
  onOpenPaciente?: (id: string) => void;
}) {
  const router = useRouter();
  const [localCandidates, setLocalCandidates] = useState<Candidate[] | undefined>(undefined);
  const normalized = useMemo(() => normalize(query), [query]);
  const detectedIntent = useMemo(() => intentFor(normalized), [normalized]);
  const showGuidance = useMemo(() => needsGuidance(query) || !!detectedIntent, [query, detectedIntent]);
  const tips = useMemo(() => (showGuidance ? buildSuggestions(query) : []), [query, showGuidance]);
  const text = useMemo(() => answerFor(query), [query]);
  useEffect(() => {
    try {
      const q = normalize(query);
      const go = (p: string) => {
        try {
          router.push(p);
        } catch { }
      };
      if ((q.includes("ver") || q.includes("quiero ver")) && q.includes("pacient")) {
        go(pathsConfig.app.pacientes);
        return;
      }
      if ((q.includes("ver") || q.includes("quiero ver")) && (q.includes("agenda") || q.includes("cita"))) {
        go(pathsConfig.app.agenda);
        return;
      }
      if ((q.includes("ver") || q.includes("quiero ver")) && (q.includes("inventario") || q.includes("material"))) {
        go(pathsConfig.app.inventario);
        return;
      }
      if (intentFor(q) === "crear_paciente") {
        const prefill = extractPrefillFromQuery(query);
        if (prefill && Object.keys(prefill).length > 0) {
          localStorage.setItem("optisave.prefillPaciente", JSON.stringify(prefill));
        }
        go(`${pathsConfig.app.crearpaciente}?prefill=1`);
        return;
      }
    } catch { }
  }, [query]);
  useEffect(() => {
    try {
      if (!candidates || candidates.length === 0) {
        const raw = localStorage.getItem("optisave.prefillPaciente.accum");
        const parsed = raw ? JSON.parse(raw) : {};
        const arr = Array.isArray(parsed?.search_candidates)
          ? parsed.search_candidates.map((c: any) => ({ id: String(c.id), nombre: String(c.nombre) }))
          : [];
        if (arr.length) setLocalCandidates(arr);
      }
    } catch {}
  }, [candidates]);
  return (
    <Card className="border border-border">
      <CardHeader className="py-2 px-3">
        <div className="font-medium">Asistente</div>
      </CardHeader>
      <CardContent className="py-2 px-3 space-y-2">
        <div className="text-sm">{text}</div>
        {tips.length > 0 && (
          <div className="space-y-1">
            {tips.map((t, i) => (
              <div key={i} className="text-sm">• {t}</div>
            ))}
          </div>
        )}
        {showGuidance && (
          <div className="mt-2 space-y-2">
            {buildLinks(query).map((l, i) => (
              <div key={i} className="text-sm">
                <Link className="underline" href={l.url}>{l.label}</Link>
              </div>
            ))}
          </div>
        )}
        {Array.isArray(candidates) && candidates.length > 0 && (
          <div className="mt-2 space-y-2">
            {candidates.map((c) => (
              <Card key={c.id} className="border border-border">
                <CardHeader className="py-2 px-3">{c.nombre}</CardHeader>
                <CardFooter className="py-2 px-3 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPaciente && onOpenPaciente(c.id)}
                  >
                    Abrir historial
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
        {(!candidates || !candidates.length) && Array.isArray(localCandidates) && localCandidates.length > 0 && (
          <div className="mt-2 space-y-2">
            {localCandidates.map((c) => (
              <Card key={c.id} className="border border-border">
                <CardHeader className="py-2 px-3">{c.nombre}</CardHeader>
                <CardFooter className="py-2 px-3 pt-0">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onOpenPaciente && onOpenPaciente(c.id)}
                  >
                    Abrir historial
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function makeFallbackAnswer(query: string, candidates?: Candidate[], onOpenPaciente?: (id: string) => void) {
  return <FallbackAnswer query={query} candidates={candidates} onOpenPaciente={onOpenPaciente} />;
}
function absolute(path: string) {
  try {
    const base = appConfig.production
      ? appConfig.url
      : (typeof window !== 'undefined' ? window.location.origin : appConfig.url);
    return new URL(path, base).toString();
  } catch {
    return path;
  }
}

function buildLinks(query: string): Array<{ label: string; url: string }> {
  const q = normalize(query);
  const out: Array<{ label: string; url: string }> = [];
  const add = (label: string, path: string) => out.push({ label, url: absolute(path) });
  if (q.includes("pacient") || q.includes("view") || q.includes("historial")) {
    add("Ver pacientes", pathsConfig.app.pacientes);
  }
  if ((q.includes("crear") || q.includes("registr") || q.includes("cita nueva")) && q.includes("pacient")) {
    add("Crear paciente", `${pathsConfig.app.crearpaciente}?prefill=1`);
  }
  if (q.includes("cita") || q.includes("agenda") || q.includes("calendario")) {
    add("Abrir agenda", pathsConfig.app.agenda);
  }
  if (q.includes("inventario") || q.includes("material")) {
    add("Inventario", pathsConfig.app.inventario);
  }
  if (q.includes("qr")) {
    add("Registro por QR", pathsConfig.app.qr);
  }
  if (q.includes("dashboard") || q.includes("inicio") || q.includes("home")) {
    add("Dashboard", pathsConfig.app.home);
  }
  if (!out.length) {
    add("Ver pacientes", pathsConfig.app.pacientes);
    add("Abrir agenda", pathsConfig.app.agenda);
    add("Crear paciente", `${pathsConfig.app.crearpaciente}?prefill=1`);
  }
  return out;
}

function extractPrefillFromQuery(original: string): Record<string, any> {
  const text = String(original || "");
  const lower = text.toLowerCase();
  const out: Record<string, any> = {};

  const nombreMatch = text.match(/(?:me\s+llamo\s+|nombre\s+(?:es|:)\s*)([a-zA-ZÁÉÍÓÚÑáéíóúñ\s]+)/);
  if (nombreMatch) {
    out.nombre = nombreMatch[1]?.trim();
  }
  if (!out.nombre) {
    const pacienteName = text.match(/paciente\s+([A-Za-zÁÉÍÓÚÑáéíóúñ\s]+?)(?=\s+(?:de|con|que|,|\.|$))/);
    if (pacienteName) {
      out.nombre = pacienteName[1]?.trim();
    }
  }

  const telMatch = text.replace(/\D+/g, " ").match(/\b(\d{10})\b/);
  if (telMatch) {
    out.telefono = telMatch[1];
  }

  const edadMatch = lower.match(/(\d{1,3})\s*(años|anos|anios)/);
  if (edadMatch) {
    out.edad = parseInt(edadMatch[1] || "0", 10);
  }

  if (lower.includes("masculino") || lower.includes("hombre")) {
    out.sexo = "masculino";
  } else if (lower.includes("femenino") || lower.includes("mujer")) {
    out.sexo = "femenino";
  }

  const domicilioMatch = text.match(/(?:domic\w+|direcc(?:ion|ión))\s*(?:es|:)?\s*([^\n,.]+)/i);
  if (domicilioMatch) {
    out.domicilio = domicilioMatch[1]?.trim();
  }
  if (!out.domicilio && lower.includes("pacient") && (lower.includes("años") || lower.includes("anos") || lower.includes("anios"))) {
    const conMatch = text.match(/con\s+([^\n,.]+)/i);
    if (conMatch) {
      out.domicilio = conMatch[1]?.trim();
    }
  }

  // Fecha de nacimiento: soporta yyyy-mm-dd, dd/mm/yyyy, dd-mm-yyyy y frases
  const fnISO = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  const fnDMY = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
  const fnWords = lower.match(/naci[oó]\s*(?:el\s*)?(\d{1,2})\s+de\s+([a-záéíóú]+)\s+de\s+(\d{4})/);
  if (!out.fecha_nacimiento) {
    if (fnISO) {
      out.fecha_nacimiento = `${fnISO[1]}-${fnISO[2]}-${fnISO[3]}`;
    } else if (fnDMY) {
      const d = fnDMY[1]?.padStart(2, '0');
      const m = fnDMY[2]?.padStart(2, '0');
      const y = fnDMY[3]?.length === 2 ? `20${fnDMY[3]}` : fnDMY[3];
      out.fecha_nacimiento = `${y}-${m}-${d}`;
    } else if (fnWords) {
      const meses: Record<string, string> = { 'enero': '01', 'febrero': '02', 'marzo': '03', 'abril': '04', 'mayo': '05', 'junio': '06', 'julio': '07', 'agosto': '08', 'septiembre': '09', 'setiembre': '09', 'octubre': '10', 'noviembre': '11', 'diciembre': '12' };
      const d = fnWords[1]?.padStart(2, '0');
      const m = meses[fnWords[2] as keyof typeof meses] || '01';
      const y = fnWords[3];
      out.fecha_nacimiento = `${y}-${m}-${d}`;
    }
  }

  // Fecha de cita: soporta "hoy", "mañana", fechas explícitas
  if (lower.includes("hoy")) {
    out.fecha_de_cita = "hoy";
  } else if (lower.includes("ma\u00f1ana") || lower.includes("mañana")) {
    out.fecha_de_cita = "mañana";
  } else {
    const fcISO = lower.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
    const fcDMY = lower.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b/);
    if (fcISO) {
      out.fecha_de_cita = `${fcISO[1]}-${fcISO[2]}-${fcISO[3]}`;
    } else if (fcDMY) {
      const d = fcDMY[1]?.padStart(2, '0');
      const m = fcDMY[2]?.padStart(2, '0');
      const y = fcDMY[3]?.length === 2 ? `20${fcDMY[3]}` : fcDMY[3];
      out.fecha_de_cita = `${y}-${m}-${d}`;
    }
  }

  // Hora de cita HH:MM
  const hora = lower.match(/\b(\d{1,2}:\d{2})\b/);
  if (hora) {
    out.hora_de_cita = hora[1];
  }

  // Último examen visual: "último examen" o "ultimo examen" número
  const uev = lower.match(/\b(?:\u00faltimo|ultimo)\s+examen\s+visual\s*(?:hace\s*)?(\d{1,2})\b/);
  if (uev) {
    out.ultimo_examen_visual = uev[1];
  }

  // Tipos de lentes
  const tiposL = text.match(/tipos?\s+de\s+lentes?\s*(?:es|:)?\s*([^\n,\.]+)/i);
  if (tiposL) {
    out.tipos_de_lentes = tiposL[1]?.trim();
  }

  // Tiempo de uso de lentes
  const tiempoL = lower.match(/tiempo\s+de\s+uso\s+de\s+lentes\s*(?:es|:)?\s*(\d{1,2})\s*(a\u00f1os|anos|anios|meses)?/);
  if (tiempoL) {
    const n = tiempoL[1];
    const unidad = tiempoL[2] || 'años';
    out.tiempo_de_uso_lentes = `${n} ${unidad}`;
  }

  // Cirugías
  if (lower.match(/cirug[ií]as?\s*(si|sí)/) || lower.match(/operaci[oó]n\s+ocular/)) {
    out.cirujias = true;
  } else if (lower.match(/cirug[ií]as?\s*(no)/)) {
    out.cirujias = false;
  }

  // Traumatismos oculares y nombre
  if (lower.match(/traumatismos?\s+oculares?\s*(si|sí)/)) {
    out.traumatismos_oculares = true;
  } else if (lower.match(/traumatismos?\s+oculares?\s*(no)/)) {
    out.traumatismos_oculares = false;
  }
  const nombreTrauma = text.match(/(?:traumatismo|traumatismos)\s*(?:ocular(?:es)?\s*)?(?:es|:)?\s*([^\n,\.]+)/i);
  if (nombreTrauma) {
    out.nombre_traumatismos_oculares = nombreTrauma[1]?.trim();
  }

  // Antecedentes familiares visuales y de salud
  const antVis = text.match(/antecedentes?\s+visuales?\s+familiares?\s*(?:es|:)?\s*([^\n,\.]+)/i);
  if (antVis) {
    out.antecedentes_visuales_familiares = antVis[1]?.trim();
  }
  const antSalud = text.match(/antecedente\s+familiar\s+salud\s*(?:es|:)?\s*([^\n,\.]+)/i);
  if (antSalud) {
    out.antecedente_familiar_salud = antSalud[1]?.trim();
  }

  // Hábitos visuales
  const habitos = text.match(/h[aá]bitos?\s+visuales?\s*(?:es|:)?\s*([^\n,\.]+)/i);
  if (habitos) {
    out.habitos_visuales = habitos[1]?.trim();
  }

  // Salud general
  const salud = text.match(/salud\s+general\s*(?:es|:)?\s*([^\n,\.]+)/i);
  if (salud) {
    out.salud_general = salud[1]?.trim();
  }

  // Medicamento actual
  const med = text.match(/medicamento\s+actual\s*(?:es|:)?\s*([^\n,\.]+)/i);
  if (med) {
    out.medicamento_actual = med[1]?.trim();
  }

  // Síntomas visuales ya recogidos, mantener

  const ocupacionMatch = text.match(/ocupa(?:cion)?\s*(?:es|:)\s*([^\n,.]+)/i);
  if (ocupacionMatch) {
    out.ocupacion = ocupacionMatch[1]?.trim();
  }

  if (lower.includes("hoy")) {
    out.fecha_de_cita = "hoy";
  }

  if (lower.includes("revisión") || lower.includes("revision") || lower.includes("chequeo")) {
    out.motivo_consulta = "Revisión de rutina";
  } else if (lower.includes("dolor") || lower.includes("molestia")) {
    out.motivo_consulta = "Dolor o molestia ocular";
  } else if (lower.includes("lentes")) {
    out.motivo_consulta = "Revisión de lentes";
  } else if (lower.includes("borrosa")) {
    out.motivo_consulta = "Visión borrosa";
  }

  const sintomas: string[] = [];
  if (lower.includes("borrosa")) sintomas.push("Visión borrosa de lejos");
  if (lower.includes("dolor de cabeza")) sintomas.push("Dolor de cabeza");
  if (lower.includes("ardor") || lower.includes("picazon") || lower.includes("picazón")) sintomas.push("Ardor o picazón ocular");
  if (lower.includes("lagrimeo")) sintomas.push("Lagrimeo");
  if (sintomas.length) out.sintomas_visuales = sintomas.join(", ");

  if (lower.includes("usa lentes") || lower.includes("lentes")) {
    out.uso_lentes = true;
  }

  return out;
}
