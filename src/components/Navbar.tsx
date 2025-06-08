"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface UserRole {
  role: {
    name: string;
  };
}

export default function Navbar() {
  const { data: session, status } = useSession();
  const [darkMode, setDarkMode] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const adminRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        setIsMobileMenuOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // On mount, set darkMode from localStorage or system preference
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)"
    ).matches;
    if (theme === "dark" || (!theme && prefersDark)) {
      setDarkMode(true);
      document.documentElement.classList.add("dark");
    } else {
      setDarkMode(false);
      document.documentElement.classList.remove("dark");
    }
  }, []);

  // When darkMode changes, update <html> class and localStorage
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [darkMode]);

  if (!session) return null;

  const hasAdminRole = session.user.roles?.some(
    (role: UserRole) => role.role.name === "ADMIN"
  );

  const hasAccountingRole = session.user.roles?.some(
    (role: UserRole) => role.role.name === "ACCOUNTING"
  );

  const hasManagerRole = session.user.roles?.some(
    (role: UserRole) => role.role.name === "MANAGER"
  );

  const canAccessDashboard = hasAdminRole || hasAccountingRole;

  const getDefaultLandingPage = () => {
    if (hasAdminRole || hasAccountingRole) {
      return "/dashboard";
    }
    return "/expenses";
  };

  const NavItems = () => (
    <>
      {/* Dashboard - for Admin and Accounting only */}
      {canAccessDashboard && (
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-1"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span>Dashboard</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z"
            />
          </svg>
        </Link>
      )}

      {/* Expenses - for everyone */}
      <Link
        href="/expenses"
        className="flex items-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-1"
        onClick={() => setIsMobileMenuOpen(false)}
      >
        <span>Expenses</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="w-5 h-5"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 00-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 01-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 003 15h-.75M15 10.5a3 3 0 11-6 0 3 3 0 016 0zm3 0h.008v.008H18V10.5zm-12 0h.008v.008H6V10.5z"
          />
        </svg>
      </Link>

      {/* Manage - for Managers */}
      {hasManagerRole && (
        <Link
          href="/manage"
          className="flex items-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-1"
          onClick={() => setIsMobileMenuOpen(false)}
        >
          <span>Manage</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-5 h-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
            />
          </svg>
        </Link>
      )}

      {/* Admin - only for Admins */}
      {hasAdminRole && (
        <>
          {/* Desktop Admin Dropdown */}
          <div className="hidden md:block relative" ref={adminRef}>
            <Link
              type="button"
              href={"/admin/users"}
              className="flex items-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-1"
              aria-haspopup="true"
              aria-controls="admin-menu"
            >
              <span>Admin</span>
            </Link>
          </div>

          {/* Mobile Admin Button */}
          <div className="md:hidden">
            <Link
              type="button"
              href={"/admin/users"}
              className="flex items-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-3 py-1 w-full"
              aria-controls="mobile-admin-menu"
            >
              <span>Admin</span>
            </Link>
          </div>
        </>
      )}
    </>
  );

  const MobileMenu = () => {
    if (!mounted) return null;

    return createPortal(
      <div
        ref={mobileMenuRef}
        className="md:hidden fixed inset-x-0 top-16 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 backdrop-blur-md border-b border-blue-500/20 dark:border-gray-700 shadow-lg"
        style={{
          position: "fixed",
          zIndex: 9999,
        }}
      >
        <div className="px-4 py-2 space-y-2">
          <NavItems />
          <button
            onClick={() => signOut()}
            className="w-full flex items-center justify-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1"
            aria-label="Logout"
          >
            <span>Logout</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-5 h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
              />
            </svg>
          </button>
        </div>
      </div>,
      document.body
    );
  };

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 backdrop-blur-md border-b border-blue-500/20 dark:border-gray-700 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link
            href={getDefaultLandingPage()}
            className="text-2xl font-extrabold text-white hover:text-blue-100 focus:text-blue-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1"
          >
            <span className="text-xl font-bold text-blue-900 dark:text-blue-200">
              Cashflow Tuesday
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <NavItems />
            <div className="flex items-center gap-4">
              <button
                onClick={() => setDarkMode((d) => !d)}
                className="p-2 rounded-lg text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
                aria-label="Toggle dark mode"
              >
                {darkMode ? "🌙" : "☀️"}
              </button>
              <button
                onClick={() => signOut()}
                className="flex items-center gap-2 text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1"
                aria-label="Logout"
              >
                <span>Logout</span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-4">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-lg text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Toggle dark mode"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg text-white hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Toggle menu"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="w-6 h-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && mounted && <MobileMenu />}
    </nav>
  );
}
