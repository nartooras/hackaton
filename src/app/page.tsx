"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

interface Todo {
  id: number;
  title: string;
  description: string | null;
  completed: boolean;
  createdAt: string;
  updatedAt: string;
  userId: string;
}

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({ title: "", description: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  // Fetch todos only if authenticated
  useEffect(() => {
    if (status === "authenticated") {
      fetchTodos();
    }
  }, [status]); // Depend on status to fetch after authentication

  const fetchTodos = async () => {
    const response = await fetch('/api/todos');
    // Check if the response is OK before processing
    if (response.ok) {
      const data = await response.json();
      setTodos(data);
    } else {
      // Handle the error case, e.g., log it or set an empty array
      console.error('Failed to fetch todos:', response.status, response.statusText);
      setTodos([]); // Ensure todos is an empty array on error
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default form submission that reloads the page
    if (!newTodo.title.trim()) return; // Prevent adding empty todos

    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTodo),
    });

    if (response.ok) {
      // Refetch todos after successful addition
      fetchTodos();
      setNewTodo({ title: '', description: '' }); // Clear the input fields
    } else {
      // Handle errors, maybe show a message to the user
      console.error('Failed to add todo', response.statusText);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (!session) return; // Only toggle if authenticated
    const response = await fetch(`/api/todos/${todo.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...todo, completed: !todo.completed }),
    });
    if (response.ok) {
      fetchTodos();
    }
  };

  const deleteTodo = async (id: number) => {
    if (!session) return; // Only delete if authenticated
    setDeletingId(id);
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchTodos();
    }
    setDeletingId(null);
  };

  // Show loading or nothing while authentication status is resolving
  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">Loading...</div>
      </main>
    );
  }

  // Render the page only if authenticated
  if (status === "authenticated") {
    return (
      <main className="min-h-screen p-4 sm:p-8 bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-4xl font-extrabold text-center text-blue-900 dark:text-blue-200 tracking-tight drop-shadow-sm animate-fade-in">
              Todo List
            </h1>
          </div>

          <form
            onSubmit={addTodo}
            className="mb-10 space-y-4 bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-6 backdrop-blur-md animate-fade-in-up"
          >
            <div>
              <input
                type="text"
                placeholder="Todo title"
                value={newTodo.title}
                onChange={(e) =>
                  setNewTodo({ ...newTodo, title: e.target.value })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-lg text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-800/80 placeholder-slate-500 dark:placeholder-slate-300"
                required
              />
            </div>
            <div>
              <textarea
                placeholder="Description (optional)"
                value={newTodo.description}
                onChange={(e) =>
                  setNewTodo({ ...newTodo, description: e.target.value })
                }
                className="w-full p-3 border border-gray-300 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-base text-gray-900 dark:bg-gray-800/80 dark:text-gray-100 placeholder-slate-500 dark:placeholder-slate-300"
              />
            </div>
            <button
              type="submit"
              className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-6 py-2 rounded-lg hover:from-blue-600 hover:to-indigo-600 active:scale-95 transition-all cursor-pointer font-semibold shadow-md"
            >
              Add Todo
            </button>
          </form>

          <div className="space-y-5">
            {todos.length === 0 && (
              <div className="text-center text-gray-400 dark:text-gray-500 animate-fade-in">
                No todos yet. Add your first one!
              </div>
            )}
            {todos.map((todo) => (
              <div
                key={todo.id}
                className={
                  `flex items-center justify-between p-4 border-b last:border-0 
                  border-gray-200 dark:border-gray-700 
                  bg-white dark:bg-gray-800`
                }
              >
                <div className="flex items-start space-x-4">
                  <input
                    type="checkbox"
                    checked={todo.completed}
                    onChange={() => toggleTodo(todo)}
                    className="mt-1 cursor-pointer w-5 h-5 rounded border border-gray-300 dark:border-gray-600 text-blue-500 focus:ring-blue-500 transition-all dark:bg-gray-800"
                  />
                  <div>
                    <h3
                      className={`font-semibold text-lg ${
                        todo.completed
                          ? "line-through text-gray-400 dark:text-gray-600"
                          : "text-gray-900 dark:text-gray-100"
                      } transition-colors`}
                    >
                      {todo.title}
                    </h3>
                    {todo.description && (
                      <p className="text-gray-500 dark:text-gray-400 mt-1 text-base transition-colors">
                        {todo.description}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => deleteTodo(todo.id)}
                  className="text-red-500 hover:text-red-700 active:text-red-800 transition-colors cursor-pointer px-3 py-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900 font-medium shadow-sm group-hover:scale-105 group-active:scale-95 border border-red-400 dark:border-red-500 flex items-center justify-center min-w-[70px]"
                  aria-label="Delete todo"
                  disabled={deletingId === todo.id}
                >
                  {deletingId === todo.id ? (
                    <svg className="animate-spin h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                    </svg>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    );
  }

  return null; // Should not reach here if status is loading or unauthenticated
}

// Tailwind CSS custom animations
// Add to globals.css:
// .animate-fade-in { @apply opacity-0 animate-[fadeIn_0.7s_ease-in-out_forwards]; }
// .animate-fade-in-up { @apply opacity-0 animate-[fadeInUp_0.7s_ease-in-out_forwards]; }
// @keyframes fadeIn { to { opacity: 1; } }
// @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
// .animate-fade-in-up { transform: translateY(20px); }
