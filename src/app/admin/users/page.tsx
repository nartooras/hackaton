'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface Role {
  id: string;
  name: string;
  description: string | null;
}

interface User {
  id: string;
  name: string | null;
  email: string | null;
  roles: {
    role: {
      id: string;
      name: string;
      description: string | null;
    };
  }[];
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [roles, setRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<{ [key: string]: string[] }>({})

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (!session?.user?.roles?.map((role: any) => role.role.name).some((roleName: string) => roleName.toLowerCase() === 'admin')) {
      router.push('/')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.roles?.map((role: any) => role.role.name).some((roleName: string) => roleName.toLowerCase() === 'admin')) return

      try {
        const [usersResponse, rolesResponse] = await Promise.all([
          fetch('/api/admin/users'),
          fetch('/api/admin/roles')
        ])

        if (!usersResponse.ok || !rolesResponse.ok) {
          throw new Error('Failed to fetch data')
        }

        const [usersData, rolesData] = await Promise.all([
          usersResponse.json(),
          rolesResponse.json()
        ])

        setUsers(usersData)
        setRoles(rolesData)

        // Initialize selected roles for each user
        const initialSelectedRoles: { [key: string]: string[] } = {}
        usersData.forEach((user: User) => {
          initialSelectedRoles[user.id] = user.roles.map(r => r.role.id)
        })
        setSelectedRoles(initialSelectedRoles)
      } catch (err) {
        setError('Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  const handleRoleChange = (userId: string, roleId: string, checked: boolean) => {
    setSelectedRoles(prev => ({
      ...prev,
      [userId]: checked
        ? [...(prev[userId] || []), roleId]
        : (prev[userId] || []).filter(id => id !== roleId)
    }))
  }

  const handleSaveRoles = async (userId: string) => {
    try {
      const response = await fetch(`/api/admin/users/${userId}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roleIds: selectedRoles[userId]
        })
      })

      if (!response.ok) {
        throw new Error('Failed to update roles')
      }

      const updatedUser = await response.json()
      setUsers(prev => prev.map(user => 
        user.id === userId ? updatedUser : user
      ))
      setEditingUser(null)
    } catch (err) {
      setError('Failed to update roles')
      console.error('Error updating roles:', err)
    }
  }

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
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            User Management
          </h1>

          {error && (
            <div className="mb-4 p-4 text-red-700 bg-red-100 rounded-lg dark:bg-red-900 dark:text-red-200">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Roles
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.name || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {user.email || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {editingUser === user.id ? (
                        <div className="space-y-2">
                          {roles.map((role) => (
                            <label key={`${user.id}-${role.id}`} className="flex items-center space-x-2">
                              <input
                                type="checkbox"
                                checked={selectedRoles[user.id]?.includes(role.id)}
                                onChange={(e) => handleRoleChange(user.id, role.id, e.target.checked)}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                              />
                              <span className="text-sm text-gray-900 dark:text-gray-100">{role.name}</span>
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map((userRole) => (
                            <span
                              key={`${user.id}-${userRole.role.id}`}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200"
                            >
                              {userRole.role.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                      {editingUser === user.id ? (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleSaveRoles(user.id)}
                            className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingUser(null)}
                            className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEditingUser(user.id)}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-xs font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Edit Roles
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
} 