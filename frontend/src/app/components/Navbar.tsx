'use client';
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from '../../components/ui/resizable-navbar';
import { useState } from 'react';
import { useAuthStore } from '@/lib/stores/auth.store';
import Link from 'next/link';
import { User, LogOut, LayoutDashboard } from 'lucide-react';

export function NavbarDemo() {
  const { isAuthenticated, user, logout } = useAuthStore();
  const navItems = [
    {
      name: 'Pricing',
      link: '#pricing',
    },
  ];

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 mt-8">
      <Navbar>
        {/* Desktop Navigation */}
        <NavBody>
          <Link href="/">
            <NavbarLogo />
          </Link>
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <Link href="/dashboard">
                  <NavbarButton variant="secondary" className="flex items-center gap-2">
                    <LayoutDashboard className="h-4 w-4" />
                    Dashboard
                  </NavbarButton>
                </Link>
                <div className="flex items-center gap-2 rounded-full border border-neutral-200 bg-neutral-100 px-3 py-1 dark:border-neutral-700 dark:bg-neutral-800">
                  <User className="h-4 w-4 text-neutral-600 dark:text-neutral-400" />
                  <span className="max-w-[100px] truncate text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {user?.name || user?.email?.split('@')[0]}
                  </span>
                </div>
                <button
                  onClick={() => logout()}
                  className="p-2 text-neutral-500 transition-colors hover:text-red-500"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/login">
                  <NavbarButton variant="secondary">Login</NavbarButton>
                </Link>
                <Link href="/signup">
                  <NavbarButton variant="primary">Sign Up</NavbarButton>
                </Link>
              </>
            )}
          </div>
        </NavBody>

        {/* Mobile Navigation */}
        <MobileNav>
          <MobileNavHeader>
            <Link href="/">
              <NavbarLogo />
            </Link>
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600 dark:text-neutral-300"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
            <div className="flex w-full flex-col gap-4">
              {isAuthenticated ? (
                <>
                  <Link href="/dashboard" className="w-full">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="primary"
                      className="w-full"
                    >
                      Dashboard
                    </NavbarButton>
                  </Link>
                  <NavbarButton
                    onClick={() => {
                      logout();
                      setIsMobileMenuOpen(false);
                    }}
                    variant="secondary"
                    className="w-full"
                  >
                    Logout
                  </NavbarButton>
                </>
              ) : (
                <>
                  <Link href="/login" className="w-full">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="secondary"
                      className="w-full"
                    >
                      Login
                    </NavbarButton>
                  </Link>
                  <Link href="/signup" className="w-full">
                    <NavbarButton
                      onClick={() => setIsMobileMenuOpen(false)}
                      variant="primary"
                      className="w-full"
                    >
                      Sign Up
                    </NavbarButton>
                  </Link>
                </>
              )}
            </div>
          </MobileNavMenu>
        </MobileNav>
      </Navbar>
    </div>
  );
}
