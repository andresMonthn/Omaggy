"use client";
import { NotificationsPopover } from '@kit/notifications/components';
import { PacientesRealtimeNotifications } from '@kit/notifications/components';
import { useUserWorkspace } from '@kit/accounts/hooks/use-user-workspace';
import featuresFlagConfig from '~/config/feature-flags.config';

export function UserNotifications(props: { userId: string }) {
  if (!featuresFlagConfig.enableNotifications) {
    return null;
  }
  const { workspace } = useUserWorkspace();
  const accountId = workspace.id ?? null;
  if (!accountId) {
    return null;
  }

  return (
    <>
      <NotificationsPopover
        accountIds={[accountId]}
        realtime={featuresFlagConfig.realtimeNotifications}
      />

      <PacientesRealtimeNotifications userId={props.userId} accountId={accountId} />
    </>
  );
}
