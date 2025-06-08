'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function ExpensesPage() {
  const { status } = useSession()
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">Loading...</div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-extrabold text-center text-blue-900 dark:text-blue-200 tracking-tight drop-shadow-sm animate-fade-in">
            Claim Your Expenses
          </h1>
        </div>

        {/* Form will be added here */}
        <div className="bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 backdrop-blur-md animate-fade-in-up">
          <p className="text-center text-gray-600 dark:text-gray-400">
            Expense claim form coming soon...
          </p>
        </div>
      </div>
    </main>
  )
} 