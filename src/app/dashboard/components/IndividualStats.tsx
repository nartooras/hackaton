'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { UserIcon } from '@heroicons/react/24/outline'
import Select from 'react-select'

interface UserStats {
  userId: string
  userName: string
  totalAmount: number
  expenseCount: number
  averageAmount: number
  categories: {
    categoryId: string
    categoryName: string
    amount: number
  }[]
}

interface IndividualStatsProps {
  userId?: string
  period: 'monthly' | 'yearly' | 'custom'
  startDate?: string
  endDate?: string
}

export default function IndividualStats({ userId, period, startDate, endDate }: IndividualStatsProps) {
  const [stats, setStats] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUser, setSelectedUser] = useState<UserStats | null>(null)

  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setLoading(true)
        const queryParams = new URLSearchParams({
          period,
          ...(startDate && endDate && {
            startDate,
            endDate,
          }),
        })

        const response = await fetch(`/api/dashboard/user-stats?${queryParams}`)
        if (!response.ok) {
          throw new Error('Failed to fetch user statistics')
        }

        const data = await response.json()
        setStats(data)
        if (data.length > 0) {
          setSelectedUser(data[0])
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchUserStats()
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
        <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">No data available</h3>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          No user statistics found for the selected period.
        </p>
      </div>
    )
  }

  const userOptions = stats.map(user => ({
    value: user.userId,
    label: user.userName,
  }))

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select User
        </label>
        <Select
          options={userOptions}
          value={userOptions.find(option => option.value === selectedUser?.userId)}
          onChange={(option) => {
            const user = stats.find(stat => stat.userId === option?.value)
            setSelectedUser(user || null)
          }}
          className="react-select-container"
          classNamePrefix="react-select"
          classNames={{
            control: () => "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700",
            menu: () => "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
            option: () => "hover:bg-gray-100 dark:hover:bg-gray-600",
          }}
          styles={{
            input: (base) => ({
              ...base,
              color: 'inherit',
            }),
            singleValue: (base) => ({
              ...base,
              color: 'inherit',
            }),
          }}
        />
      </div>

      {selectedUser && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            {selectedUser.userName}'s Statistics
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Amount</p>
              <p className="text-2xl font-semibold text-blue-600 dark:text-blue-400">
                €{selectedUser.totalAmount.toLocaleString()}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Number of Expenses</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                {selectedUser.expenseCount}
              </p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <p className="text-sm text-gray-500 dark:text-gray-400">Average Amount</p>
              <p className="text-2xl font-semibold text-green-600 dark:text-green-400">
                €{selectedUser.averageAmount.toLocaleString()}
              </p>
            </div>
          </div>

          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-3">
            Expenses by Category
          </h4>
          <div className="space-y-3">
            {selectedUser.categories.map((category) => (
              <div
                key={category.categoryId}
                className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <span className="text-gray-900 dark:text-white">{category.categoryName}</span>
                <span className="text-blue-600 dark:text-blue-400 font-medium">
                  €{category.amount.toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  )
} 