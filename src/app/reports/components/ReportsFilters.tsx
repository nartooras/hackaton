'use client'

import { useState, useEffect, useCallback } from 'react'
import { User, ExpenseStatus } from '@prisma/client'
import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline'
import { useDebounce } from '@/hooks/useDebounce'

interface ReportsFiltersProps {
  filters: {
    userId: string
    period: string
    month: number
    year: number
    category: string
    status: ExpenseStatus | ''
  }
  onFilterChange: (filters: any) => void
  onExport: () => void
}

export default function ReportsFilters({
  filters,
  onFilterChange,
  onExport
}: ReportsFiltersProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [suggestedUsers, setSuggestedUsers] = useState<User[]>([])
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const debouncedSearchQuery = useDebounce(searchQuery, 300)

  const fetchUsers = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSuggestedUsers([])
      return
    }

    setIsLoadingUsers(true)
    try {
      const response = await fetch(`/api/users/search?query=${encodeURIComponent(query)}`)
      if (response.ok) {
        const data = await response.json()
        setSuggestedUsers(data)
      }
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [])

  useEffect(() => {
    fetchUsers(debouncedSearchQuery)
  }, [debouncedSearchQuery, fetchUsers])

  const handleUserSelect = (user: User) => {
    onFilterChange({ ...filters, userId: user.id })
    setSearchQuery(user.name)
    setShowSuggestions(false)
  }

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setShowSuggestions(true)
  }

  const handleSearchBlur = () => {
    // Delay hiding suggestions to allow for click events
    setTimeout(() => {
      setShowSuggestions(false)
    }, 200)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm mb-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h2>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
          >
            {isExpanded ? (
              <ChevronUpIcon className="h-5 w-5" />
            ) : (
              <ChevronDownIcon className="h-5 w-5" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* User Search */}
            <div className="relative">
              <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                User
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="user-search"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onBlur={handleSearchBlur}
                  placeholder="Search users..."
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                {isLoadingUsers && (
                  <div className="absolute right-3 top-2.5">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  </div>
                )}
              </div>
              {showSuggestions && suggestedUsers.length > 0 && (
                <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-700 shadow-lg rounded-md border border-gray-200 dark:border-gray-600 max-h-60 overflow-auto">
                  {suggestedUsers.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleUserSelect(user)}
                      className="w-full px-4 py-2 text-left text-sm text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600 focus:outline-none"
                    >
                      {user.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Period */}
            <div>
              <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Period
              </label>
              <select
                id="period"
                value={filters.period}
                onChange={(e) => onFilterChange({ ...filters, period: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="month">Monthly</option>
                <option value="year">Yearly</option>
              </select>
            </div>

            {/* Month */}
            {filters.period === 'month' && (
              <div>
                <label htmlFor="month" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Month
                </label>
                <select
                  id="month"
                  value={filters.month}
                  onChange={(e) => onFilterChange({ ...filters, month: parseInt(e.target.value) })}
                  className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                    <option key={month} value={month}>
                      {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Year */}
            <div>
              <label htmlFor="year" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                id="year"
                value={filters.year}
                onChange={(e) => onFilterChange({ ...filters, year: parseInt(e.target.value) })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                id="category"
                value={filters.category}
                onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                <option value="TRAVEL">Travel</option>
                <option value="MEALS">Meals</option>
                <option value="ACCOMMODATION">Accommodation</option>
                <option value="SUPPLIES">Supplies</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                id="status"
                value={filters.status}
                onChange={(e) => onFilterChange({ ...filters, status: e.target.value as ExpenseStatus | '' })}
                className="w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Statuses</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            onClick={onExport}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Export to CSV
          </button>
        </div>
      </div>
    </div>
  )
} 