"use client";

import { useEffect, useState, use } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { User, Role } from "@prisma/client";
import Select, { MultiValue } from 'react-select'
import { motion } from 'framer-motion'

interface UserWithRoles extends User {
  roles: {
    role: Role;
  }[];
  managedUsers?: {
    id: string;
    name: string | null;
    email: string | null;
    roles: {
      role: {
        name: string;
      };
    }[];
  }[];
}

interface FormData {
  name: string;
  email: string;
  password: string;
  roleId: string;
}

interface EmployeeOption {
  value: string;
  label: string;
  email: string;
  roles: string[];
}

export default function EditUserPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserWithRoles | null>(null);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    password: "",
    roleId: "",
  });
  const [availableEmployees, setAvailableEmployees] = useState<UserWithRoles[]>([]);
  const [selectedEmployees, setSelectedEmployees] = useState<EmployeeOption[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.roles?.map((role: any) => role.role.name).some((roleName: string) => roleName.toLowerCase() === 'admin')) return

      try {
        const [userResponse, rolesResponse, employeesResponse] = await Promise.all([
          fetch(`/api/admin/users/${id}`),
          fetch('/api/admin/roles'),
          fetch('/api/admin/users')
        ])

        if (!userResponse.ok || !rolesResponse.ok || !employeesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [userData, rolesData, employeesData] = await Promise.all([
          userResponse.json(),
          rolesResponse.json(),
          employeesResponse.json()
        ])

        setUser(userData)
        setRoles(rolesData)
        // Filter out the current user from available employees
        const availableEmps = employeesData.filter((emp: UserWithRoles) => emp.id !== id)
        setAvailableEmployees(availableEmps)
        
        // Convert managed users to options format
        const selectedEmps = userData.managedUsers?.map((emp: any) => ({
          value: emp.id,
          label: emp.name || 'Unnamed',
          email: emp.email || '',
          roles: emp.roles.map((r: any) => r.role.name)
        })) || []
        setSelectedEmployees(selectedEmps)
        
        setFormData({
          name: userData.name || '',
          email: userData.email || '',
          password: '',
          roleId: userData.roles[0]?.role.id || '',
        })
      } catch (err) {
        setError('Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    if (status === 'authenticated') {
      fetchData()
    }
  }, [status, session, id])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          managedUserIds: selectedEmployees.map(emp => emp.value)
        }),
      })

      if (!response.ok) {
        const errorData = await response.text()
        throw new Error(errorData || 'Failed to update user')
      }

      router.push('/admin/users')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user')
      setLoading(false)
    }
  }

  const handleEmployeeChange = (selected: MultiValue<EmployeeOption>) => {
    setSelectedEmployees([...selected])
  }

  // Convert available employees to options format
  const employeeOptions: EmployeeOption[] = availableEmployees.map(emp => ({
    value: emp.id,
    label: emp.name || 'Unnamed',
    email: emp.email || '',
    roles: emp.roles.map(r => r.role.name)
  }))

  // Custom option component to show more details
  const CustomOption = ({ innerProps, label, data }: any) => (
    <div {...innerProps} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
      <div className="font-medium text-gray-900 dark:text-white">{label}</div>
      <div className="text-sm text-gray-500 dark:text-gray-400">{data.email}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {data.roles.join(', ')}
      </div>
    </div>
  )

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </div>
    )
  }

  if (!session || !session.user.roles?.map((role: any) => role.role.name).some((roleName: string) => roleName.toLowerCase() === 'admin')) {
    return null
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
              Edit User
            </h1>
            <button
              onClick={() => router.push('/admin/users')}
              className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Back to Users
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 dark:bg-red-900 dark:text-red-200 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base py-3 px-4"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base py-3 px-4"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Leave blank to keep current password"
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base py-3 px-4"
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
            >
              <label htmlFor="roleId" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Role
              </label>
              <select
                id="roleId"
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:bg-gray-700 dark:text-white text-base py-3 px-4"
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 }}
            >
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Managed Employees
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
                classNames={{
                  control: () => "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700",
                  menu: () => "bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600",
                  option: () => "hover:bg-gray-100 dark:hover:bg-gray-600",
                  multiValue: () => "bg-blue-100 dark:bg-blue-900",
                  multiValueLabel: () => "text-blue-800 dark:text-blue-200",
                  multiValueRemove: () => "text-blue-800 dark:text-blue-200 hover:bg-blue-200 dark:hover:bg-blue-800",
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
            </motion.div>

            <motion.div 
              className="flex justify-end space-x-3"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <button
                type="button"
                onClick={() => router.push('/admin/users')}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </motion.div>
          </form>
        </motion.div>
      </div>
    </div>
  )
} 