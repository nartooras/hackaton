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
  const { status } = useSession();
  const router = useRouter();

  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodo, setNewTodo] = useState({ title: "", description: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/expenses");
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchTodos();
    }
  }, [status]);

  const fetchTodos = async () => {
    const response = await fetch('/api/todos');
    if (response.ok) {
      const data = await response.json();
      setTodos(data);
    } else {
      console.error('Failed to fetch todos:', response.status, response.statusText);
      setTodos([]);
    }
  };

  const addTodo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodo.title.trim()) return;

    const response = await fetch('/api/todos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newTodo),
    });

    if (response.ok) {
      fetchTodos();
      setNewTodo({ title: '', description: '' });
    } else {
      console.error('Failed to add todo', response.statusText);
    }
  };

  const toggleTodo = async (todo: Todo) => {
    if (!status) return;
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
    if (!status) return;
    setDeletingId(id);
    const response = await fetch(`/api/todos/${id}`, {
      method: "DELETE",
    });
    if (response.ok) {
      fetchTodos();
    }
    setDeletingId(null);
  };

  if (status === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors">
        <div className="text-xl font-semibold text-blue-800 dark:text-blue-200 animate-pulse">Loading...</div>
      </main>
    );
  }

  return null;
}

// Tailwind CSS custom animations
// Add to globals.css:
// .animate-fade-in { @apply opacity-0 animate-[fadeIn_0.7s_ease-in-out_forwards]; }
// .animate-fade-in-up { @apply opacity-0 animate-[fadeInUp_0.7s_ease-in-out_forwards]; }
// @keyframes fadeIn { to { opacity: 1; } }
// @keyframes fadeInUp { to { opacity: 1; transform: translateY(0); } }
// .animate-fade-in-up { transform: translateY(20px); }
