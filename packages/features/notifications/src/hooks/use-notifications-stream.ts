import { useEffect } from 'react';

import { useQuery } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

type Notification = {
  id: number;
  body: string;
  dismissed: boolean;
  type: 'info' | 'warning' | 'error';
  created_at: string;
  link: string | null;
};

export function useNotificationsStream(params: {
  onNotifications: (notifications: Notification[]) => void;
  accountIds: string[];
  enabled: boolean;
}) {
  const client = useSupabase();

  const { data: subscription } = useQuery({
    enabled: params.enabled,
    queryKey: ['realtime-notifications', ...params.accountIds],
    queryFn: () => {
      const channel = client.channel('notifications-channel');

      params.accountIds.forEach((id) => {
        channel.on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'notifications',
            filter: `account_id=eq.${id}`,
          },
          (payload) => {
            params.onNotifications([payload.new as Notification]);
          },
        );

        channel.on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'notifications',
            filter: `account_id=eq.${id}`,
          },
          (payload) => {
            params.onNotifications([payload.new as Notification]);
          },
        );
      });

      return channel.subscribe();
    },
  });

  useEffect(() => {
    return () => {
      void subscription?.unsubscribe();
    };
  }, [subscription]);
}
