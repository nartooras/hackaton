'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ChartBarIcon } from '@heroicons/react/24/outline'

interface CategoryStats {
  categoryId: string
  categoryName: string
  totalAmount: number
  expenseCount: number
  percentage: number
}

interface CategoryOverviewProps {
  period: 'monthly' | 'yearly' | 'custom'
  startDate?: string
  endDate?: string
}

export default function CategoryOverview({ period, startDate, endDate }: CategoryOverviewProps) {
  const [stats, setStats] = useState<CategoryStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchCategoryStats = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          period,
          ...(startDate && endDate && {
            startDate,
            endDate,
          }),
        })

        const response = await fetch(`/api/dashboard/category-stats?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to fetch category statistics')
        }

        const data = await response.json()
        setStats(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCategoryStats()
  }, [period, startDate, endDate])

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

  if (stats.length === 0) {
    return (
      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No data available</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No expenses found for the selected period.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.categoryId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
          >
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {stat.categoryName}
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Total Amount</span>
                <span className="text-lg font-semibold text-blue-600 dark:text-blue-400">
                  €{stat.totalAmount.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Number of Expenses</span>
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  {stat.expenseCount}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 dark:text-gray-400">Percentage</span>
                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                  {stat.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
} 