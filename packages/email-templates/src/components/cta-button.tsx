import { Button } from '@react-email/components';

/** Botón CTA. Función: Renderiza enlace principal con estilos para llamadas a la acción en emails. */

export function CtaButton(
  props: React.PropsWithChildren<{
    href: string;
  }>,
) {
  return (
    <Button
      className="w-full rounded bg-[#000000] py-3 text-center text-[16px] font-semibold text-white no-underline"
      href={props.href}
    >
      {props.children}
    </Button>
  );
}
