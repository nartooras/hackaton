'use client'

import { useState, useEffect } from 'react'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface UserRole {
  role: {
    name: string;
  };
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: UserRole[];
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { data: session, status } = useSession()

  useEffect(() => {
    if (status === 'authenticated') {
      // Check if user has ACCOUNTING role
      const user = session?.user as SessionUser
      const hasAccountingRole = user?.roles?.some(
        (role) => role.role.name === "ACCOUNTING"
      )

      // Redirect based on role
      if (hasAccountingRole) {
        router.push('/dashboard')
      } else {
        router.push('/expenses')
      }
    }
  }, [status, session, router])

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError(null)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid email or password')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-900/80 rounded-xl shadow-lg p-6 space-y-6 backdrop-blur-md animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center text-blue-900 dark:text-blue-200 tracking-tight drop-shadow-sm">Welcome to Cashflow Tuesday</h1>
        <p className="text-center text-gray-600 dark:text-gray-400">Please login to continue</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-red-500 text-sm text-center">{error}</p>}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg bg-white/90 dark:bg-gray-800/80 dark:text-gray-100 placeholder-slate-500 dark:placeholder-slate-300"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-lg bg-white/90 dark:bg-gray-800/80 dark:text-gray-100 placeholder-slate-500 dark:placeholder-slate-300"
              required
            />
          </div>
          
          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-md shadow-sm hover:from-blue-600 hover:to-indigo-600 active:scale-95 transition-all cursor-pointer font-semibold focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Sign in
          </button>
        </form>
        
        {/* Forgot password link */}
        <div className="text-center">
          <a href="/forgot-password" className="text-blue-600 hover:underline dark:text-blue-400 text-sm">
            Forgot Password?
          </a>
        </div>

        <div className="text-center text-sm">
          <Link href="/register" className="font-medium text-blue-600 dark:text-blue-400 hover:underline">
            Don&apos;t have an account? Register here.
          </Link>
        </div>
      </div>
    </main>
  )
} 