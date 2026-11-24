'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import {
  Boxes,
  ExternalLink,
  FileText,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Settings,
  Tags,
  X,
} from 'lucide-react';
import { cn } from '@/lib/ui';

const NAV = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/orders', label: 'Orders', icon: ReceiptText },
  { href: '/admin/pages', label: 'Pages', icon: FileText },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export function AdminShell({
  user,
  siteName,
  children,
}: {
  user: { name: string; email: string };
  siteName: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => setMobileOpen(false), [pathname]);

  const isActive = (href: string) => (href === '/admin' ? pathname === '/admin' : pathname.startsWith(href));

  async function signOut() {
    setSigningOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  }

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Admin">
      {NAV.map((item) => {
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-md px-3 py-2.5 text-[13px] transition',
              active ? 'bg-paper/10 text-paper' : 'text-paper/55 hover:bg-paper/5 hover:text-paper',
            )}
          >
            <item.icon className="h-4 w-4" strokeWidth={1.6} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  const sidebarInner = (
    <div className="flex h-full flex-col bg-[#14120f]">
      <div className="flex items-center justify-between px-5 py-5">
        <Link href="/admin" className="min-w-0">
          <p className="truncate font-display text-[17px] leading-tight text-paper">{siteName}</p>
          <p className="mt-0.5 text-[10px] uppercase tracking-[0.2em] text-paper/40">Store admin</p>
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-md text-paper/60 hover:bg-paper/10 hover:text-paper lg:hidden"
          aria-label="Close menu"
        >
          <X className="h-4 w-4" strokeWidth={1.6} />
        </button>
      </div>

      {nav}

      <div className="border-t border-paper/10 p-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center gap-2 rounded-md px-3 py-2 text-[12.5px] text-paper/55 transition hover:bg-paper/5 hover:text-paper"
        >
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.6} />
          View storefront
        </Link>
        <div className="mt-2 rounded-md bg-paper/5 px-3 py-3">
          <p className="truncate text-[12.5px] text-paper">{user.name}</p>
          <p className="truncate text-[11px] text-paper/45">{user.email}</p>
          <button
            type="button"
            onClick={signOut}
            disabled={signingOut}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.1em] text-paper/60 transition hover:text-paper disabled:opacity-50"
          >
            <LogOut className="h-3 w-3" strokeWidth={1.8} />
            {signingOut ? 'Signing out…' : 'Sign out'}
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#faf9f6]">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[236px] lg:block">{sidebarInner}</aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-ink/40"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            tabIndex={-1}
          />
          <div className="absolute inset-y-0 left-0 w-[262px] shadow-lift">{sidebarInner}</div>
        </div>
      ) : null}

      <div className="lg:pl-[236px]">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-hairline bg-[#faf9f6]/95 px-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-hairline text-ink"
            aria-label="Open menu"
            aria-expanded={mobileOpen}
          >
            <Menu className="h-4 w-4" strokeWidth={1.6} />
          </button>
          <p className="truncate text-[13px] font-medium">{siteName} admin</p>
          <Link href="/" target="_blank" className="text-[11px] uppercase tracking-[0.1em] text-graphite">
            Store
          </Link>
        </header>

        <main className="mx-auto w-full max-w-[1180px] px-4 py-6 sm:px-6 lg:px-8 lg:py-9">{children}</main>
      </div>
    </div>
  );
}
