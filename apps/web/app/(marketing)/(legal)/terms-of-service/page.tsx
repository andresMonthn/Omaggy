/** Términos de servicio. Función: Genera metadata y cabecera de la sección legal; aquí se mostrará el acuerdo de uso. */
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:termsOfService'),
  };
}

async function TermsOfServicePage() {
  const { t } = await createI18nServerInstance();

  return (
    <>
      <SitePageHeader title={t('marketing:termsOfService')} subtitle={t('marketing:termsOfServiceSubtitle')} />
    </>
  );
}

export default withI18n(TermsOfServicePage);
