"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError("Credenciales incorrectas. Verifica tu email y contraseña.");
      setLoading(false);
      return;
    }

    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 min-h-screen bg-dhl-red">
      {/* Logo */}
      <div className="mb-10">
        <Image
          src="/dhl-logo.svg"
          alt="DHL"
          width={120}
          height={17}
          className="brightness-0 invert"
          priority
        />
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-dhl-dark mb-1">
          Bienvenido
        </h1>
        <p className="text-dhl-gray text-sm mb-6">
          Ingresa con tus credenciales de red DHL
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-dhl-dark mb-1">
              Email corporativo
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              placeholder="nombre@dhl.com"
              className="w-full border border-dhl-mid-gray rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dhl-red focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-dhl-dark mb-1">
              Contraseña
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full border border-dhl-mid-gray rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-dhl-red focus:border-transparent"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-dhl-red text-sm rounded-lg px-4 py-3 border border-red-200">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-dhl-red text-white font-bold py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
          >
            {loading ? "Ingresando..." : "Ingresar"}
          </button>
        </form>
      </div>

      {/* Footer */}
      <p className="text-white/60 text-xs mt-8 text-center">
        DHL Connect &amp; Park © 2025
      </p>
    </div>
  );
}
