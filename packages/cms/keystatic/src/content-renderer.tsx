/** Renderizador Keystatic. Función: Devuelve contenido Markdoc/Keystatic como nodos React sin transformación extra. */
export function KeystaticContentRenderer(props: { content: unknown }) {
  return props.content as React.ReactNode;
}
