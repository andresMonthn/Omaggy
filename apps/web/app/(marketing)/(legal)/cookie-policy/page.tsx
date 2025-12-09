/** Política de cookies. Función: Genera metadata y muestra cabecera de la sección legal; el contenido detallado se añadirá aquí. */
import { Separator } from '@kit/ui/separator';
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:cookiePolicy'),
  };
}

async function CookiePolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <>
      <SitePageHeader title={t('marketing:cookiePolicy')} subtitle={t('marketing:cookiePolicySubtitle')} />
      <Separator />
    </>
  );
}

export default withI18n(CookiePolicyPage);
