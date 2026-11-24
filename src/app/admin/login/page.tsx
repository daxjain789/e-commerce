import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { LoginForm } from '@/components/admin/login-form';
import { getCurrentUser } from '@/lib/auth';
import { getSettings } from '@/lib/settings';

export const dynamic = 'force-dynamic';
export const metadata: Metadata = { title: 'Admin sign in' };

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect('/admin');
  const settings = getSettings();

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#14120f] px-5 py-16">
      <div className="w-full max-w-[400px]">
        <div className="text-center">
          <p className="font-display text-[26px] tracking-[-0.02em] text-paper">{settings.siteName}</p>
          <p className="mt-1 text-[10.5px] uppercase tracking-[0.24em] text-paper/40">Store admin</p>
        </div>
        <div className="mt-8 rounded-lg border border-paper/10 bg-[#1b1815] p-6 shadow-lift">
          <LoginForm />
        </div>
        <p className="mt-6 text-center text-[11.5px] leading-relaxed text-paper/35">
          First run? Use the credentials from <code className="text-paper/60">ADMIN_EMAIL</code> and{' '}
          <code className="text-paper/60">ADMIN_PASSWORD</code> in your environment file.
        </p>
      </div>
    </div>
  );
}
