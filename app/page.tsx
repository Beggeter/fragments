"use client";

import { AuthTest } from "@/components/AuthTest";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">
          🔐 Тест новой системы авторизации
        </h1>
        <AuthTest />
      </div>
    </div>
  );
}
