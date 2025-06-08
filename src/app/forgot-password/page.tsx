"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/");
    }
  }, [status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");

    if (!email) {
      setError("Please enter your email address.");
      return;
    }

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(
          data.message ||
            "If an account with that email exists, a password reset link will be sent."
        );
        setEmail(""); // Clear email field on success
      } else {
        setError(data.error || "Failed to request password reset.");
      }
    } catch (err) {
      setError("An error occurred.");
      console.error(err);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-100 dark:from-gray-900 dark:to-gray-800 transition-colors p-4">
      <div className="max-w-md w-full bg-white/80 dark:bg-gray-800/80 rounded-xl shadow-lg p-8 space-y-6 backdrop-blur-md animate-fade-in-up">
        <h1 className="text-3xl font-bold text-center text-blue-900 dark:text-blue-200">
          Forgot Password
        </h1>

        {message && (
          <p className="text-green-600 dark:text-green-400 text-center">
            {message}
          </p>
        )}
        {error && (
          <p className="text-red-600 dark:text-red-400 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-gray-900 dark:text-gray-100 bg-white/90 dark:bg-gray-800/80 placeholder-slate-500 dark:placeholder-slate-300"
            />
          </div>

          <button
            type="submit"
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-lg font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 active:scale-95 transition-all cursor-pointer"
          >
            Request Reset Link
          </button>
        </form>

        {/* Link back to login */}
        <div className="text-center mt-4 text-sm text-gray-600 dark:text-gray-400">
          Remember your password?&nbsp;
          <a
            href="/login"
            className="font-medium text-blue-600 dark:text-blue-400 hover:underline"
          >
            Login here.
          </a>
        </div>
      </div>
    </main>
  );
}
