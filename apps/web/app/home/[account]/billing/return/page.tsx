import { notFound, redirect } from 'next/navigation';
import { getBillingGatewayProvider } from '@kit/billing-gateway';
import { BillingSessionStatus } from '@kit/billing-gateway/components';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

import billingConfig from '~/config/billing.config';
import { withI18n } from '~/lib/i18n/with-i18n';
import { requireUserInServerComponent } from '~/lib/server/require-user-in-server-component';

import { EmbeddedCheckoutForm } from '../_components/embedded-checkout-form';

interface SessionPageProps {
  searchParams: Promise<{
    session_id: string;
  }>;
}

async function ReturnCheckoutSessionPage({ searchParams }: SessionPageProps) {
  const sessionId = (await searchParams).session_id;

  if (!sessionId) {
    redirect('../');
  }

  const { customerEmail, checkoutToken } = await loadCheckoutSession(sessionId);

  if (checkoutToken) {
    return (
      <EmbeddedCheckoutForm
        checkoutToken={checkoutToken}
        provider={billingConfig.provider}
      />
    );
  }

  return (
    <>
      <div className={'fixed top-48 left-0 z-50 mx-auto w-full'}>
        <BillingSessionStatus
          redirectPath={'../'}
          customerEmail={customerEmail ?? ''}
        />
      </div>
      <BlurryBackdrop />
    </>
  );
}

export default withI18n(ReturnCheckoutSessionPage);

function BlurryBackdrop() {
  return (
    <div
      className={
        'bg-background/30 fixed top-0 left-0 w-full backdrop-blur-sm' +
        ' !m-0 h-full mb-[40px]'
      }
    />
  );
}

async function loadCheckoutSession(sessionId: string) {
  await requireUserInServerComponent();

  const client = getSupabaseServerClient();
  const gateway = await getBillingGatewayProvider(client);

  const session = await gateway.retrieveCheckoutSession({
    sessionId,
  });

  if (!session) {
    notFound();
  }

  const checkoutToken = session.isSessionOpen ? session.checkoutToken : null;

  // Recovery path: if webhook hasn't updated DB yet, upsert subscription now
  try {
    if (!checkoutToken && session.subscriptionId) {
      const subscription = await gateway.getSubscription(session.subscriptionId);

      const admin = getSupabaseServerAdminClient();
      await admin.rpc('upsert_subscription', subscription);
    }
  } catch {
    // silently ignore errors to avoid blocking the page
  }

  // otherwise - we show the user the return page
  // and display the details of the session
  return {
    status: session.status,
    customerEmail: session.customer.email,
    checkoutToken,
  };
}
