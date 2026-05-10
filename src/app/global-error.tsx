"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="text-center">
          <p className="text-5xl mb-5">⚠️</p>
          <p className="text-xl font-bold text-gray-900 mb-2">Error crítico</p>
          <p className="text-sm text-gray-500 mb-8 max-w-xs mx-auto">
            {error.message || "La aplicación encontró un problema inesperado."}
          </p>
          <button
            onClick={reset}
            className="bg-yellow-400 text-gray-900 font-bold px-6 py-3.5 rounded-2xl"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
