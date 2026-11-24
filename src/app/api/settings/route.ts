import { requireApiUser, fail, json, readJson } from '@/lib/http';
import { getSettings, saveSettings } from '@/lib/settings';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { response } = await requireApiUser();
  if (response) return response;
  const settings = getSettings();
  return json({
    data: {
      ...settings,
      payments: {
        cod: settings.payments.cod,
        bank: settings.payments.bank,
        stripe: {
          ...settings.payments.stripe,
          secretKey: settings.payments.stripe.secretKey ? '••••••••' : '',
          webhookSecret: settings.payments.stripe.webhookSecret ? '••••••••' : '',
        },
      },
    },
  });
}

export async function PUT(request: Request) {
  const { response } = await requireApiUser();
  if (response) return response;
  const body = await readJson<Record<string, any>>(request);
  if (typeof body !== 'object' || body === null) return fail('Expected a settings object.', 422);

  const current = getSettings();
  const patch: Record<string, unknown> = { ...body };

  // Never overwrite stored secrets with the masked placeholder.
  if (body.payments) {
    const stripe = body.payments.stripe ?? {};
    patch.payments = {
      ...current.payments,
      ...body.payments,
      stripe: {
        ...current.payments.stripe,
        ...stripe,
        secretKey:
          stripe.secretKey === '••••••••' || stripe.secretKey === undefined
            ? current.payments.stripe.secretKey
            : String(stripe.secretKey).trim(),
        webhookSecret:
          stripe.webhookSecret === '••••••••' || stripe.webhookSecret === undefined
            ? current.payments.stripe.webhookSecret
            : String(stripe.webhookSecret).trim(),
      },
    };
  }

  const settings = saveSettings(patch);
  return json({ data: settings });
}
