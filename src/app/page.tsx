"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/expenses");
    } else if (status === "unauthenticated") {
      router.push("/login");
    }
  }, [status, router]);

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
