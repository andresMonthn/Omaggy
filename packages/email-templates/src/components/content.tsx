import { Container } from '@react-email/components';

/** Contenedor de contenido. Función: Encapsula contenido principal con padding y fondo blanco. */

export function EmailContent({
  children,
  className,
}: React.PropsWithChildren<{
  className?: string;
  displayLogo?: boolean;
}>) {
  return (
    <Container
      className={
        'mx-auto rounded-xl bg-white px-[48px] py-[36px] ' + className || ''
      }
    >
      {children}
    </Container>
  );
}
