import { Container, Section } from '@react-email/components';

/** Cabecera de email. Función: Contenedor de encabezado para título/logo u otros elementos superiores. */

export function EmailHeader(props: React.PropsWithChildren) {
  return (
    <Container>
      <Section>{props.children}</Section>
    </Container>
  );
}
