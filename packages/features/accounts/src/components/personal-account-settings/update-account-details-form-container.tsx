'use client';

/** Contenedor detalles de cuenta. Función: Orquesta actualización de nombre y revalida datos del usuario. */

import { useRevalidatePersonalAccountDataQuery } from '../../hooks/use-personal-account-data';
import { UpdateAccountDetailsForm } from './update-account-details-form';

export function UpdateAccountDetailsFormContainer({
  user,
}: {
  user: {
    name: string | null;
    id: string;
  };
}) {
  const revalidateUserDataQuery = useRevalidatePersonalAccountDataQuery();

  return (
    <UpdateAccountDetailsForm
      displayName={user.name ?? ''}
      userId={user.id}
      onUpdate={() => revalidateUserDataQuery(user.id)}
    />
  );
}
