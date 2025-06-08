'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { toast } from 'react-hot-toast'
import Select, { MultiValue } from 'react-select'
import { motion } from "framer-motion"

interface User {
  id: string
  name: string | null
  email: string | null
  roles?: { role: { name: string } }[]
}

interface Category {
  id: string
  name: string
  description: string | null
  categoryEmployees: {
    user: User
  }[]
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  employeeIds: z.array(z.string()).optional(),
})

type FormValues = z.infer<typeof formSchema>

function CategoryForm({ categoryId }: { categoryId: string }) {
  const { status } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<User[]>([])
  const [category, setCategory] = useState<Category | null>(null)
  const [selectedEmployees, setSelectedEmployees] = useState<{ value: string, label: string, email: string, roles: string[] }[]>([])

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      employeeIds: [],
    },
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    }
  }, [status, router])

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch category if it's not a new one
        const categoryPromise = categoryId === 'new' 
          ? Promise.resolve(null)
          : fetch(`/api/admin/categories/${categoryId}`).then(res => res.ok ? res.json() : null)

        const [categoryData, usersResponse] = await Promise.all([
          categoryPromise,
          fetch('/api/admin/users'),
        ])

        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users')
        }

        const usersData = await usersResponse.json()
        setUsers(usersData)

        if (categoryData) {
          setCategory(categoryData)
          form.reset({
            name: categoryData.name,
            description: categoryData.description || '',
            employeeIds: categoryData.categoryEmployees.map((e: any) => e.user.id),
          })
          setSelectedEmployees(categoryData.categoryEmployees.map((e: any) => ({
            value: e.user.id,
            label: e.user.name || e.user.email || 'Unnamed',
            email: e.user.email || '',
            roles: e.user.roles?.map((r: any) => r.role.name) || []
          })))
        }
      } catch (err) {
        setError('Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, categoryId, form])

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await fetch(
        categoryId === 'new' 
          ? '/api/admin/categories'
          : `/api/admin/categories/${categoryId}`,
        {
          method: categoryId === 'new' ? 'POST' : 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(data),
        }
      )

      if (!response.ok) {
        throw new Error('Failed to save category')
      }

      toast.success(`Category ${categoryId === 'new' ? 'created' : 'updated'} successfully`)
      router.push('/admin/categories')
    } catch (err) {
      toast.error('Failed to save category')
      console.error('Error saving category:', err)
    }
  }

  const employeeOptions = users.map((user) => ({
    value: user.id,
    label: user.name || user.email || 'Unnamed',
    email: user.email || '',
    roles: user.roles?.map((r: any) => r.role?.name) || []
  }))

  const CustomOption = ({ innerProps, label, data }: any) => (
    <div {...innerProps} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
      <div className="font-medium text-gray-900 dark:text-white">{label}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{data.email}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{data.roles.join(', ')}</div>
    </div>
  )

  const handleEmployeeChange = (selected: MultiValue<any>) => {
    setSelectedEmployees([...selected])
    form.setValue('employeeIds', selected.map((emp) => emp.value))
  }

  if (status === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-red-600 dark:text-red-400">
          {error}
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
              {categoryId === 'new' ? 'Add New Category' : 'Edit Category'}
            </h1>
            <button
              onClick={() => router.push('/admin/categories')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Categories
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Name
              </label>
              <input
                type="text"
                id="name"
                {...form.register('name')}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base py-3 px-4"
              />
              {form.formState.errors.name && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {form.formState.errors.name.message}
                </p>
              )}
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label
                htmlFor="description"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                Description
              </label>
              <textarea
                id="description"
                rows={3}
                {...form.register('description')}
                className="mt-1 block w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-base py-3 px-4"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label
                htmlFor="employees"
                className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2"
              >
                Assigned Employees
              </label>
              <Select
                isMulti
                value={selectedEmployees}
                onChange={handleEmployeeChange}
                options={employeeOptions}
                components={{ Option: CustomOption }}
                className="react-select-container"
                classNamePrefix="react-select"
                placeholder="Search and select employees..."
                noOptionsMessage={() => "No employees found"}
                styles={{
                  control: (base) => ({
                    ...base,
                    backgroundColor: 'var(--color-bg, white)',
                    borderColor: 'var(--color-border, #d1d5db)',
                    minHeight: '48px',
                    fontSize: '1rem',
                  }),
                  input: (base) => ({ ...base, color: 'inherit' }),
                  singleValue: (base) => ({ ...base, color: 'inherit' }),
                  menu: (base) => ({ ...base, backgroundColor: 'var(--color-bg, white)' }),
                  option: (base, state) => ({
                    ...base,
                    backgroundColor: state.isFocused ? 'var(--color-hover, #f3f4f6)' : 'inherit',
                    color: 'inherit',
                  }),
                  multiValue: (base) => ({ ...base, backgroundColor: '#dbeafe' }),
                  multiValueLabel: (base) => ({ ...base, color: '#1e40af' }),
                  multiValueRemove: (base) => ({ ...base, color: '#1e40af', backgroundColor: 'transparent' }),
                }}
              />
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Search and select multiple employees
              </p>
            </motion.div>

            <motion.div 
              className="flex justify-end space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                type="button"
                onClick={() => router.push('/admin/categories')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
}

export default function CategoryPage() {
  const params = useParams()
  if (!params?.id || Array.isArray(params.id)) {
    return null
  }
  return <CategoryForm categoryId={params.id} />
} 