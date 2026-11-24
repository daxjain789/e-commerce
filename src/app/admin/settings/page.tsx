import { PageHeader } from '@/components/admin/ui';
import { SettingsForm } from '@/components/admin/settings-form';
import { requireUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';

export default async function AdminSettingsPage() {
  await requireUser();
  const settings = getSettings();

  return (
    <div className="space-y-6">
      <PageHeader
        kicker="Configuration"
        title="Store settings"
        description="Branding, contact details, navigation, shipping and payment providers. Changes apply instantly."
      />
      <SettingsForm
        initial={{
          ...settings,
          payments: {
            cod: { ...settings.payments.cod },
            bank: { ...settings.payments.bank },
            stripe: {
              ...settings.payments.stripe,
              secretKey: settings.payments.stripe.secretKey ? '••••••••' : '',
              webhookSecret: settings.payments.stripe.webhookSecret ? '••••••••' : '',
            },
          },
        }}
      />
    </div>
  );
}
