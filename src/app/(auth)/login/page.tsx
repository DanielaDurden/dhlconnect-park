"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Image from "next/image";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);

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
    <div className="min-h-screen bg-dhl-light-gray flex flex-col">
      {/* Yellow header */}
      <div className="bg-dhl-yellow flex justify-center px-6 py-8">
        <Image src="/dhl-logo.svg" alt="DHL" width={120} height={17} priority />
      </div>

      {/* Contenido */}
      <div className="flex-1 flex flex-col items-center justify-center p-6">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-8 mt-8">
          <h1 className="text-2xl font-bold text-dhl-dark mb-1">
            Accede a DHL Stage
          </h1>
          <p className="text-dhl-gray text-sm mb-6">
            Ingresa con tus credenciales de red DHL
          </p>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-dhl-dark mb-1">
                Email corporativo
              </label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3.5 w-4 h-4 text-dhl-gray pointer-events-none" aria-hidden="true">
                  <rect x="2" y="4" width="20" height="16" rx="2"/>
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                </svg>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  placeholder="nombre@dhl.com"
                  className="w-full border border-dhl-mid-gray rounded-xl px-4 py-3 pl-9 text-sm text-dhl-dark placeholder:text-dhl-gray/60 focus:outline-none focus:ring-2 focus:ring-dhl-yellow focus:border-dhl-dark"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-sm font-medium text-dhl-dark mb-1">
                Contraseña
              </label>
              <div className="relative">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-3.5 w-4 h-4 text-dhl-gray pointer-events-none" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete={rememberMe ? "on" : "current-password"}
                  placeholder="••••••••"
                  className="w-full border border-dhl-mid-gray rounded-xl px-4 py-3 pl-9 pr-10 text-sm text-dhl-dark placeholder:text-dhl-gray/60 focus:outline-none focus:ring-2 focus:ring-dhl-yellow focus:border-dhl-dark"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 p-0.5 text-dhl-gray hover:text-dhl-dark transition-colors"
                >
                  {showPassword ? (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" x2="22" y1="2" y2="22"/>
                    </svg>
                  ) : (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Recordar contraseña + Olvidé */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-dhl-mid-gray accent-dhl-red cursor-pointer"
                />
                <span className="text-xs text-dhl-gray">Recordar sesión</span>
              </label>
              <button
                type="button"
                onClick={() => setShowForgotModal(true)}
                className="text-xs text-dhl-red hover:underline"
              >
                Olvidé mi contraseña
              </button>
            </div>

            {error && (
              <div role="alert" className="bg-red-50 text-dhl-red text-sm rounded-lg px-4 py-3 border border-red-200 flex items-center gap-2">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 flex-shrink-0" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" x2="12" y1="8" y2="12"/>
                  <line x1="12" x2="12.01" y1="16" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-dhl-red text-white font-bold py-3.5 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed mt-2 focus-visible:ring-2 focus-visible:ring-dhl-yellow focus-visible:ring-offset-2"
            >
              {loading ? "Ingresando..." : "Ingresar"}
            </button>
          </form>
        </div>

        <p className="text-dhl-gray text-xs mt-6">DHL Stage © 2026</p>
      </div>

      {/* Modal — Olvidé mi contraseña */}
      {showForgotModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4"
          onClick={() => setShowForgotModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-dhl-yellow/30 flex items-center justify-center flex-shrink-0">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-dhl-dark" aria-hidden="true">
                  <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <h2 className="text-lg font-bold text-dhl-dark">¿Olvidaste tu contraseña?</h2>
            </div>

            <p className="text-sm text-dhl-gray leading-relaxed mb-2">
              Las credenciales de acceso a DHL Stage son gestionadas por el <strong className="text-dhl-dark">Office Manager</strong>.
            </p>
            <p className="text-sm text-dhl-gray leading-relaxed mb-6">
              Comunícate directamente con tu Office Manager para restablecer tu acceso o solicitar una nueva contraseña.
            </p>

            <button
              onClick={() => setShowForgotModal(false)}
              className="w-full bg-dhl-dark text-white font-bold py-3 rounded-xl hover:bg-black transition-colors"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
