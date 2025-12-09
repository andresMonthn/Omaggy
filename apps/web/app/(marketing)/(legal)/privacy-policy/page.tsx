/** Política de privacidad. Función: Genera metadata y cabecera de la sección legal; el contenido informativo se presentará aquí. */
import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:privacyPolicy'),
  };
}

async function PrivacyPolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <>
      <SitePageHeader title={t('marketing:privacyPolicy')} subtitle={t('marketing:privacyPolicySubtitle')} />
    </>
  );
}

export default withI18n(PrivacyPolicyPage);
