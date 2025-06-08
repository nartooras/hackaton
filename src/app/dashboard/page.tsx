"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface DashboardStats {
  totalExpenses: number;
  pendingExpenses: number;
  approvedExpenses: number;
  rejectedExpenses: number;
  totalAmount: number;
}

interface UserRole {
  role: {
    name: string;
  };
}

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  image?: string | null;
  roles?: UserRole[];
}

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (status === "authenticated") {
      // Check if user has ADMIN or ACCOUNTING role
      const user = session?.user as SessionUser;
      const hasAccess = user?.roles?.some(
        (role) => role.role.name === "ADMIN" || role.role.name === "ACCOUNTING"
      );

      if (!hasAccess) {
        router.push("/expenses");
      } else {
        fetchDashboardStats();
      }
    }
  }, [status, session, router]);

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats");
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">
          Loading...
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">
          Accounting Dashboard
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Expenses Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Total Expenses
            </h3>
            <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalExpenses}
            </p>
          </div>

          {/* Pending Expenses Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Pending Expenses
            </h3>
            <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.pendingExpenses}
            </p>
          </div>

          {/* Approved Expenses Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Approved Expenses
            </h3>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">
              {stats.approvedExpenses}
            </p>
          </div>

          {/* Total Amount Card */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Total Amount
            </h3>
            <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
              €{stats.totalAmount.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Recent Expenses Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Recent Expenses
          </h2>
          {/* We'll add the table component here in the next step */}
        </div>
      </div>
    </div>
  );
} 