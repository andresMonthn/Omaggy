import React from 'react';

/** Renderizador de Wordpress: inyecta HTML recibido mediante `dangerouslySetInnerHTML`. */

export function WordpressContentRenderer(props: { content: unknown }) {
  return <div dangerouslySetInnerHTML={{ __html: props.content as string }} />;
}
