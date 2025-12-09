/** Estilos del body. Función: Inyecta estilos base para el cuerpo del email (bg, tipografía, color). */
export function BodyStyle() {
  return (
    <style>
      {`
        body {
          background-color: #fafafa;
          margin: auto;
          font-family: sans-serif;
          color: #242424;
        }
    `}
    </style>
  );
}
