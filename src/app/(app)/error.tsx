"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="px-4 py-16 text-center">
      <p className="text-5xl mb-5">⚠️</p>
      <p className="text-xl font-black text-dhl-dark mb-2">Algo salió mal</p>
      <p className="text-sm text-dhl-gray mb-8 max-w-xs mx-auto leading-relaxed">
        {error.message || "Error inesperado. Por favor intenta de nuevo."}
      </p>
      <button
        onClick={reset}
        className="bg-dhl-yellow text-dhl-dark font-bold px-6 py-3.5 rounded-2xl shadow-md"
      >
        Reintentar
      </button>
    </div>
  );
}
