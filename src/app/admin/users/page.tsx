'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

interface User {
  id: string;
  name: string | null;
  email: string | null;
  roles: {
    role: {
      name: string;
      description: string | null;
    };
  }[];
}

interface Role {
  name: string;
  description: string | null;
}

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [users, setUsers] = useState<User[]>([])
  const [availableRoles, setAvailableRoles] = useState<Role[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingUser, setEditingUser] = useState<string | null>(null)
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login')
    } else if (!session?.user?.roles?.includes('Admin')) {
      router.push('/')
    }
  }, [session, status, router])

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.user?.roles?.includes('Admin')) return

      try {
        // Fetch users
        const usersResponse = await fetch('/api/admin/users')
        if (!usersResponse.ok) {
          throw new Error('Failed to fetch users')
        }
        const usersData = await usersResponse.json()
        setUsers(usersData)

        // Fetch available roles
        const rolesResponse = await fetch('/api/admin/roles')
        if (!rolesResponse.ok) {
          throw new Error('Failed to fetch roles')
        }
        const rolesData = await rolesResponse.json()
        setAvailableRoles(rolesData)
      } catch (err) {
        setError('Failed to load data')
        console.error('Error fetching data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [session])

  const handleEditRoles = (user: User) => {
    setEditingUser(user.id)
    setSelectedRoles(user.roles.map(ur => ur.role.name))
  }

  const handleRoleChange = (roleName: string) => {
    setSelectedRoles(prev => {
      if (prev.includes(roleName)) {
        // Don't allow removing Admin role from self
        if (roleName === 'Admin' && session?.user?.id === editingUser) {
          return prev
        }
        return prev.filter(r => r !== roleName)
      }
      return [...prev, roleName]
    })
  }

  const handleSaveRoles = async () => {
    if (!editingUser) return

    try {
      const response = await fetch(`/api/admin/users/${editingUser}/roles`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ roles: selectedRoles }),
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(error)
      }

      // Update the users list
      setUsers(users.map(user => 
        user.id === editingUser 
          ? {
              ...user,
              roles: selectedRoles.map(roleName => ({
                role: {
                  name: roleName,
                  description: availableRoles.find(r => r.name === roleName)?.description || null
                }
              }))
            }
          : user
      ))

      setEditingUser(null)
      setSelectedRoles([])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update roles')
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

  if (!session || !session.user.roles?.includes('Admin')) {
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
                        <div className="flex flex-wrap gap-2">
                          {availableRoles.map((role) => (
                            <label
                              key={role.name}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer"
                              style={{
                                backgroundColor: selectedRoles.includes(role.name)
                                  ? 'rgb(219 234 254)'
                                  : 'rgb(229 231 235)',
                                color: selectedRoles.includes(role.name)
                                  ? 'rgb(30 64 175)'
                                  : 'rgb(107 114 128)',
                              }}
                            >
                              <input
                                type="checkbox"
                                className="sr-only"
                                checked={selectedRoles.includes(role.name)}
                                onChange={() => handleRoleChange(role.name)}
                                disabled={role.name === 'Admin' && session.user.id === user.id}
                              />
                              {role.name}
                            </label>
                          ))}
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {user.roles.map((userRole) => (
                            <span
                              key={userRole.role.name}
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
                        <div className="flex gap-2">
                          <button
                            onClick={handleSaveRoles}
                            className="px-3 py-1 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingUser(null)
                              setSelectedRoles([])
                            }}
                            className="px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEditRoles(user)}
                          className="px-3 py-1 text-sm font-medium text-blue-600 bg-blue-100 rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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