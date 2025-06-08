"use client";

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import ReportsFilters from './components/ReportsFilters'
import ReportsTable from './components/ReportsTable'
import { User, ExpenseStatus } from '@prisma/client'
import Link from 'next/link'

export default function ReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [filters, setFilters] = useState({
    userId: '',
    period: 'month',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    category: '',
    status: '' as ExpenseStatus | '',
    page: 1,
    perPage: 10
  })
  const [expenses, setExpenses] = useState([])
  const [totalCount, setTotalCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (status === 'loading') return

    if (!session) {
      router.push('/login')
      return
    }

    // Check if user has admin or accounting role
    const isAdminOrAccounting = session.user?.roles?.some(
      (userRole: any) => userRole.role.name === 'ADMIN' || userRole.role.name === 'ACCOUNTING'
    )

    if (!isAdminOrAccounting) {
      router.push('/dashboard')
      return
    }

    // Only fetch data if user has correct role
    fetchUsers()
    fetchExpenses()
  }, [session, status])

  // Separate effect for filters to prevent unnecessary redirects
  useEffect(() => {
    if (session?.user?.roles?.some(
      (userRole: any) => userRole.role.name === 'ADMIN' || userRole.role.name === 'ACCOUNTING'
    )) {
      fetchExpenses()
    }
  }, [filters])

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    }
  }

  const fetchExpenses = async () => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: filters.page.toString(),
        perPage: filters.perPage.toString(),
        ...(filters.userId && { userId: filters.userId }),
        period: filters.period,
        month: filters.month.toString(),
        year: filters.year.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`/api/expenses/reports?${queryParams}`)
      if (response.ok) {
        const data = await response.json()
        setExpenses(data.expenses)
        setTotalCount(data.total)
      }
    } catch (error) {
      console.error('Error fetching expenses:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      const queryParams = new URLSearchParams({
        ...(filters.userId && { userId: filters.userId }),
        period: filters.period,
        month: filters.month.toString(),
        year: filters.year.toString(),
        ...(filters.category && { category: filters.category }),
        ...(filters.status && { status: filters.status })
      })

      const response = await fetch(`/api/expenses/export?${queryParams}`)
      if (response.ok) {
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `expenses-report-${new Date().toISOString()}.csv`
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
      }
    } catch (error) {
      console.error('Error exporting expenses:', error)
    }
  }

  // Show loading state while checking session
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  // Show loading state if session is not available yet
  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  // Check role after session is available
  const isAdminOrAccounting = session.user?.roles?.some(
    (userRole: any) => userRole.role.name === 'ADMIN' || userRole.role.name === 'ACCOUNTING'
  )

  if (!isAdminOrAccounting) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-red-600 dark:text-red-400">
          Access Denied
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Expense Reports
            </h1>
            <Link
              href="/dashboard"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Dashboard
            </Link>
          </div>

          <ReportsFilters
            filters={filters}
            onFilterChange={setFilters}
            onExport={handleExport}
          />

          <ReportsTable
            expenses={expenses}
            totalCount={totalCount}
            filters={filters}
            onFilterChange={setFilters}
            isLoading={isLoading}
          />
        </motion.div>
      </div>
    </div>
  )
} 