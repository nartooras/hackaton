'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CalendarIcon, UserIcon, CheckIcon, ChevronUpDownIcon } from '@heroicons/react/24/outline'
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, addMonths, subYears, addYears } from 'date-fns'
import { useDebounce } from '@/hooks/useDebounce'
import { Combobox } from '@headlessui/react'

interface User {
  id: string
  name: string
}

interface FilterState {
  userId?: string
  period: 'monthly' | 'yearly' | 'custom'
  startDate?: string
  endDate?: string
  selectedMonth?: Date
  selectedYear?: Date
}

interface DashboardFiltersProps {
  filters: FilterState
  onFilterChange: (filters: FilterState) => void
}

export default function DashboardFilters({ filters, onFilterChange }: DashboardFiltersProps) {
  const [users, setUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoadingUsers, setIsLoadingUsers] = useState(false)
  
  const hasLoadedInitialUsers = useRef(false)
  const lastSearchQuery = useRef('')
  const debouncedSearch = useDebounce(searchQuery, 500)

  const fetchUsers = useCallback(async (query: string) => {
    if (isLoadingUsers || query === lastSearchQuery.current) return

    try {
      setIsLoadingUsers(true)
      lastSearchQuery.current = query
      const response = await fetch(`/api/users?search=${encodeURIComponent(query)}`)
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error) {
      console.error('Error fetching users:', error)
    } finally {
      setIsLoadingUsers(false)
    }
  }, [isLoadingUsers])

  // Load initial users only once
  useEffect(() => {
    if (!hasLoadedInitialUsers.current) {
      fetchUsers('')
      hasLoadedInitialUsers.current = true
    }
  }, [fetchUsers])

  // Handle search with debounce
  useEffect(() => {
    if (debouncedSearch !== undefined && debouncedSearch !== '') {
      fetchUsers(debouncedSearch)
    }
  }, [debouncedSearch, fetchUsers])

  // Update selected user when userId changes
  useEffect(() => {
    if (filters.userId && users.length > 0) {
      const user = users.find(u => u.id === filters.userId)
      if (user) {
        setSelectedUser(user)
        setSearchQuery(user.name)
      }
    }
  }, [filters.userId, users])

  const handleUserChange = (user: User | null) => {
    setSelectedUser(user)
    onFilterChange({
      ...filters,
      userId: user?.id,
    })
  }

  const handlePeriodChange = (newPeriod: 'monthly' | 'yearly' | 'custom') => {
    const now = new Date()
    let newStartDate = filters.startDate
    let newEndDate = filters.endDate
    let newSelectedMonth = filters.selectedMonth
    let newSelectedYear = filters.selectedYear

    if (newPeriod === 'monthly') {
      newSelectedMonth = now
      newStartDate = format(startOfMonth(now), 'yyyy-MM-dd')
      newEndDate = format(endOfMonth(now), 'yyyy-MM-dd')
    } else if (newPeriod === 'yearly') {
      newSelectedYear = now
      newStartDate = format(startOfYear(now), 'yyyy-MM-dd')
      newEndDate = format(endOfYear(now), 'yyyy-MM-dd')
    }

    onFilterChange({
      ...filters,
      period: newPeriod,
      startDate: newStartDate,
      endDate: newEndDate,
      selectedMonth: newSelectedMonth,
      selectedYear: newSelectedYear,
    })
  }

  const handleMonthChange = (direction: 'prev' | 'next') => {
    if (!filters.selectedMonth) return

    const newMonth = direction === 'prev' 
      ? subMonths(filters.selectedMonth, 1)
      : addMonths(filters.selectedMonth, 1)

    onFilterChange({
      ...filters,
      selectedMonth: newMonth,
      startDate: format(startOfMonth(newMonth), 'yyyy-MM-dd'),
      endDate: format(endOfMonth(newMonth), 'yyyy-MM-dd'),
    })
  }

  const handleYearChange = (direction: 'prev' | 'next') => {
    if (!filters.selectedYear) return

    const newYear = direction === 'prev'
      ? subYears(filters.selectedYear, 1)
      : addYears(filters.selectedYear, 1)

    onFilterChange({
      ...filters,
      selectedYear: newYear,
      startDate: format(startOfYear(newYear), 'yyyy-MM-dd'),
      endDate: format(endOfYear(newYear), 'yyyy-MM-dd'),
    })
  }

  const handleDateChange = (field: 'startDate' | 'endDate', value: string) => {
    onFilterChange({
      ...filters,
      [field]: value,
    })
  }

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="relative">
          <label htmlFor="user" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <UserIcon className="h-5 w-5 inline-block mr-1" />
            User
          </label>
          <Combobox value={selectedUser} onChange={handleUserChange}>
            <div className="relative">
              <Combobox.Input
                className="w-full h-12 px-4 py-2 text-base rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                onChange={(event) => handleSearchChange(event.target.value)}
                displayValue={(user: User) => user?.name ?? ''}
                placeholder="Search users..."
              />
              <Combobox.Button className="absolute inset-y-0 right-0 flex items-center pr-2">
                <ChevronUpDownIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </Combobox.Button>
              {isLoadingUsers && (
                <div className="absolute right-10 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                </div>
              )}
              <Combobox.Options className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 rounded-lg shadow-lg max-h-60 overflow-auto">
                {users.length === 0 ? (
                  <div className="relative cursor-default select-none py-2 px-4 text-gray-700 dark:text-gray-300">
                    No users found.
                  </div>
                ) : (
                  users.map((user) => (
                    <Combobox.Option
                      key={user.id}
                      value={user}
                      className={({ active }) =>
                        `relative cursor-default select-none py-3 px-4 ${
                          active ? 'bg-blue-600 text-white' : 'text-gray-900 dark:text-gray-100'
                        }`
                      }
                    >
                      {({ selected, active }) => (
                        <>
                          <span className={`block truncate ${selected ? 'font-medium' : 'font-normal'}`}>
                            {user.name}
                          </span>
                          {selected && (
                            <span
                              className={`absolute inset-y-0 right-0 flex items-center pr-4 ${
                                active ? 'text-white' : 'text-blue-600'
                              }`}
                            >
                              <CheckIcon className="h-5 w-5" aria-hidden="true" />
                            </span>
                          )}
                        </>
                      )}
                    </Combobox.Option>
                  ))
                )}
              </Combobox.Options>
            </div>
          </Combobox>
        </div>

        <div>
          <label htmlFor="period" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            <CalendarIcon className="h-5 w-5 inline-block mr-1" />
            Period
          </label>
          <select
            id="period"
            value={filters.period}
            onChange={(e) => handlePeriodChange(e.target.value as 'monthly' | 'yearly' | 'custom')}
            className="w-full h-12 px-4 py-2 text-base rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
          >
            <option value="monthly">This Month</option>
            <option value="yearly">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {filters.period === 'monthly' && filters.selectedMonth && (
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => handleMonthChange('prev')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format(filters.selectedMonth, 'MMMM yyyy')}
              </span>
              <button
                onClick={() => handleMonthChange('next')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
              >
                →
              </button>
            </div>
          )}

          {filters.period === 'yearly' && filters.selectedYear && (
            <div className="mt-2 flex items-center justify-between">
              <button
                onClick={() => handleYearChange('prev')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
              >
                ←
              </button>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {format(filters.selectedYear, 'yyyy')}
              </span>
              <button
                onClick={() => handleYearChange('next')}
                className="p-2 text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400"
              >
                →
              </button>
            </div>
          )}
        </div>

        {filters.period === 'custom' && (
          <>
            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date
              </label>
              <input
                type="date"
                id="startDate"
                value={filters.startDate}
                onChange={(e) => handleDateChange('startDate', e.target.value)}
                className="w-full h-12 px-4 py-2 text-base rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date
              </label>
              <input
                type="date"
                id="endDate"
                value={filters.endDate}
                onChange={(e) => handleDateChange('endDate', e.target.value)}
                className="w-full h-12 px-4 py-2 text-base rounded-lg border border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        )}
      </div>
    </div>
  )
} 