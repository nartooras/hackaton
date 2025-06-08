'use client'

import { useEffect, useState } from 'react'
import { format } from 'date-fns'
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline'

interface Expense {
  id: string
  amount: number
  description: string
  createdAt: string
  status: 'pending' | 'approved' | 'rejected'
  submittedBy: {
    name: string
  }
}

interface MonthlyStats {
  currentMonth: number
  lastMonth: number
  difference: number
}

export default function DashboardBlocks() {
  const [pendingExpenses, setPendingExpenses] = useState<Expense[]>([])
  const [approvedExpenses, setApprovedExpenses] = useState<Expense[]>([])
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats>({
    currentMonth: 0,
    lastMonth: 0,
    difference: 0
  })

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch pending expenses
        const pendingResponse = await fetch('/api/expenses?status=pending&limit=10')
        if (pendingResponse.ok) {
          const pendingData = await pendingResponse.json()
          setPendingExpenses(pendingData)
        }

        // Fetch approved expenses
        const approvedResponse = await fetch('/api/expenses?status=approved&limit=10')
        if (approvedResponse.ok) {
          const approvedData = await approvedResponse.json()
          setApprovedExpenses(approvedData)
        }

        // Fetch monthly stats
        const statsResponse = await fetch('/api/expenses/stats/monthly')
        if (statsResponse.ok) {
          const statsData = await statsResponse.json()
          setMonthlyStats(statsData)
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error)
      }
    }

    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
      {/* Pending Approvals Block */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Last 10 Pending Approvals
        </h2>
        <div className="space-y-4">
          {pendingExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {expense.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {expense.submittedBy.name} • {format(new Date(expense.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Approved Expenses Block */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Last 10 Approved Expenses
        </h2>
        <div className="space-y-4">
          {approvedExpenses.map((expense) => (
            <div
              key={expense.id}
              className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
            >
              <div>
                <p className="font-medium text-gray-900 dark:text-white">
                  {expense.description}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {expense.submittedBy.name} • {format(new Date(expense.createdAt), 'MMM d, yyyy')}
                </p>
              </div>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(expense.amount)}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Comparison Block */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Monthly Approval Comparison
        </h2>
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-600 dark:text-gray-300">This Month</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(monthlyStats.currentMonth)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Last Month</span>
              <span className="font-semibold text-gray-900 dark:text-white">
                {formatCurrency(monthlyStats.lastMonth)}
              </span>
            </div>
          </div>
          <div className={`p-4 rounded-lg ${
            monthlyStats.difference >= 0 
              ? 'bg-green-50 dark:bg-green-900/20' 
              : 'bg-red-50 dark:bg-red-900/20'
          }`}>
            <div className="flex items-center justify-between">
              <span className="text-gray-600 dark:text-gray-300">Difference</span>
              <div className="flex items-center">
                {monthlyStats.difference >= 0 ? (
                  <ArrowUpIcon className="h-5 w-5 text-green-500 mr-1" />
                ) : (
                  <ArrowDownIcon className="h-5 w-5 text-red-500 mr-1" />
                )}
                <span className={`font-semibold ${
                  monthlyStats.difference >= 0 
                    ? 'text-green-600 dark:text-green-400' 
                    : 'text-red-600 dark:text-red-400'
                }`}>
                  {formatCurrency(Math.abs(monthlyStats.difference))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 