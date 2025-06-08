import React from "react";
import { Card } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

interface Expense {
  id: string;
  title: string;
  description: string;
  amount: number;
  currency: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
  submittedAt: string;
  category: {
    name: string;
  };
  attachments: {
    filename: string;
    url: string;
  }[];
}

interface SubmittedExpensesProps {
  expenses: Expense[];
}

export function SubmittedExpenses({ expenses }: SubmittedExpensesProps) {
  const getStatusColor = (status: Expense["status"]) => {
    switch (status) {
      case "APPROVED":
        return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      default:
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold text-blue-900 dark:text-blue-200">
        Submitted Expenses
      </h2>
      {expenses.length === 0 ? (
        <p className="text-gray-600 dark:text-gray-400">
          No expenses submitted yet.
        </p>
      ) : (
        <div className="grid gap-4">
          {expenses.map((expense) => (
            <Card key={expense.id} className="p-4">
              <div className="flex flex-col space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {expense.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {expense.description}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {formatCurrency(expense.amount, expense.currency)}
                    </p>
                    <span
                      className={`inline-block px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                        expense.status
                      )}`}
                    >
                      {expense.status}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-4">
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                        />
                      </svg>
                      {expense.category.name}
                    </span>
                    <span className="flex items-center">
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {new Date(expense.submittedAt).toLocaleDateString()}
                    </span>
                  </div>
                  {expense.attachments.length > 0 && (
                    <a
                      href={expense.attachments[0].url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <svg
                        className="w-4 h-4 mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
                        />
                      </svg>
                      View Attachment
                    </a>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 