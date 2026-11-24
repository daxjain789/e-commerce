import type { ReactNode } from 'react';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';
import { AdminShell } from '@/components/admin/shell';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();
  if (!user) return <>{children}</>;
  const settings = getSettings();

  return (
    <AdminShell user={{ name: user.name, email: user.email }} siteName={settings.siteName}>
      {children}
    </AdminShell>
  );
}
