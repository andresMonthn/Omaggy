import { Container, Text } from '@react-email/components';

/** Pie de email. Función: Muestra texto auxiliar/branding al final del correo. */

export function EmailFooter(props: React.PropsWithChildren) {
  return (
    <Container>
      <Text className="px-4 text-[12px] leading-[20px] text-gray-300">
        {props.children}
      </Text>
    </Container>
  );
}
