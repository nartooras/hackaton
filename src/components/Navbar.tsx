'use client'

import { useSession, signOut } from 'next-auth/react'
import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function Navbar() {
  const { data: session } = useSession()
  const [darkMode, setDarkMode] = useState(false)

  // On mount, set darkMode from localStorage or system preference
  useEffect(() => {
    const theme = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
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

  if (!session) return null

  return (
    <nav className="bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-gray-800 dark:to-gray-900 backdrop-blur-md border-b border-blue-500/20 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link 
            href="/"
            className="text-2xl font-extrabold text-white hover:text-blue-100 focus:text-blue-100 transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1"
          >
            <span className="text-xl font-bold text-blue-900 dark:text-blue-200">Cashflow Tuesday</span>
          </Link>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setDarkMode((d) => !d)}
              className="p-2 rounded-lg text-white/90 hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50"
              aria-label="Toggle dark mode"
            >
              {darkMode ? "🌙" : "☀️"}
            </button>
            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 text-white/90 hover:text-white focus:text-white transition-colors cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/50 rounded-lg px-2 py-1"
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
      </div>
    </nav>
  )
} 