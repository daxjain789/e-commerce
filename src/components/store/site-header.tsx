'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Menu, ShoppingBag, X } from 'lucide-react';
import { cn } from '@/lib/ui';
import { useCart } from './cart-provider';

interface NavLink {
  label: string;
  href: string;
}

export function SiteHeader({
  siteName,
  nav,
  announcement,
  logoUrl,
}: {
  siteName: string;
  nav: NavLink[];
  announcement: string;
  logoUrl: string;
}) {
  const pathname = usePathname();
  const { count, ready, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => setMenuOpen(false), [pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="sticky top-0 z-40">
      {announcement ? (
        <div className="bg-ink text-paper">
          <div className="shell flex min-h-[36px] items-center justify-center py-1.5">
            <p className="text-center text-[10px] uppercase leading-[1.5] tracking-[0.16em] text-paper/85 sm:text-[10.5px] sm:tracking-[0.18em]">{announcement}</p>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          'border-b border-hairline transition-colors duration-300',
          scrolled ? 'bg-paper/90 backdrop-blur-md' : 'bg-paper',
        )}
      >
        <div className="shell flex h-[68px] items-center justify-between gap-6">
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${siteName} home`}>
            {logoUrl ? (
              <img src={logoUrl} alt="" className="h-7 w-auto" />
            ) : (
              <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
                <circle cx="13" cy="13" r="11.25" stroke="currentColor" strokeWidth="1.2" />
                <ellipse cx="13" cy="13" rx="5.4" ry="11.25" stroke="currentColor" strokeWidth="1.2" />
                <line x1="0.9" y1="13" x2="25.1" y2="13" stroke="currentColor" strokeWidth="1.2" />
              </svg>
            )}
            <span className="font-display text-[21px] leading-none tracking-[-0.02em]">{siteName}</span>
          </Link>

          <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
            {nav.map((link) => (
              <Link
                key={`${link.href}-${link.label}`}
                href={link.href}
                className={cn(
                  'link-underline text-[13px] tracking-[0.02em] text-graphite transition hover:text-ink',
                  pathname === link.href && 'text-ink',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="group relative inline-flex items-center gap-2 rounded-full px-3 py-2 text-[12px] uppercase tracking-[0.12em] text-graphite transition hover:text-ink"
              aria-label={`Open cart, ${ready ? count : 0} items`}
            >
              <ShoppingBag className="h-[18px] w-[18px]" strokeWidth={1.4} aria-hidden="true" />
              <span className="hidden sm:inline">Cart</span>
              <span
                className={cn(
                  'inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-medium leading-none transition',
                  ready && count > 0 ? 'bg-accent text-white' : 'bg-ink/10 text-graphite',
                )}
              >
                {ready ? count : 0}
              </span>
            </button>

            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-full text-graphite transition hover:text-ink md:hidden"
              onClick={() => setMenuOpen((value) => !value)}
              aria-expanded={menuOpen}
              aria-controls="mobile-nav"
              aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            >
              {menuOpen ? <X className="h-5 w-5" strokeWidth={1.4} /> : <Menu className="h-5 w-5" strokeWidth={1.4} />}
            </button>
          </div>
        </div>

        {menuOpen ? (
          <div id="mobile-nav" className="border-t border-hairline bg-paper md:hidden">
            <nav className="shell flex flex-col py-2" aria-label="Mobile">
              {nav.map((link) => (
                <Link
                  key={`${link.href}-${link.label}-m`}
                  href={link.href}
                  className="border-b border-hairline/70 py-3.5 text-[15px] text-ink last:border-0"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>
        ) : null}
      </div>
    </header>
  );
}
