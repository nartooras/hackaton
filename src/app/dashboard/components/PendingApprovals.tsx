'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ClockIcon } from '@heroicons/react/24/outline'
import { format } from 'date-fns'

interface PendingExpense {
  id: string
  amount: number
  description: string
  createdAt: string
  category: {
    id: string
    name: string
  }
  submittedBy: {
    id: string
    name: string
  }
  attachments: {
    id: string
    filename: string
    url: string
  }[]
}

export default function PendingApprovals() {
  const [expenses, setExpenses] = useState<PendingExpense[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPendingExpenses = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/expenses/pending')
        if (!response.ok) {
          throw new Error('Failed to fetch pending expenses')
        }

        const data = await response.json()
        setExpenses(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchPendingExpenses()
  }, [])

  const handleApprove = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/approve`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to approve expense')
      }

      setExpenses(expenses.filter(expense => expense.id !== expenseId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  const handleReject = async (expenseId: string) => {
    try {
      const response = await fetch(`/api/expenses/${expenseId}/reject`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to reject expense')
      }

      setExpenses(expenses.filter(expense => expense.id !== expenseId))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500 dark:text-gray-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
        <p className="text-red-600 dark:text-red-400">{error}</p>
      </div>
    )
  }

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No pending approvals</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          All expenses have been processed.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense, index) => (
        <motion.div
          key={expense.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {expense.description}
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Submitted by {expense.submittedBy.name} on {format(new Date(expense.createdAt), 'PPP')}
              </p>
            </div>
            <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
              €{expense.amount.toLocaleString()}
            </span>
          </div>

          <div className="mb-4">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              {expense.category.name}
            </span>
          </div>

          {expense.attachments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Attachments
              </h4>
              <div className="flex flex-wrap gap-2">
                {expense.attachments.map((attachment) => (
                  <a
                    key={attachment.id}
                    href={attachment.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-1 rounded-md text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                  >
                    {attachment.filename}
                  </a>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={() => handleReject(expense.id)}
              className="px-4 py-2 text-sm font-medium text-red-700 dark:text-red-200 bg-red-100 dark:bg-red-900/20 border border-transparent rounded-md hover:bg-red-200 dark:hover:bg-red-900/40 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Reject
            </button>
            <button
              onClick={() => handleApprove(expense.id)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Approve
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  )
} 