import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="text-center p-8 bg-white rounded-xl shadow-sm border border-slate-200 max-w-md w-full">
        <div className="text-5xl mb-4">🏪</div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Agente Bodega</h1>
        <p className="text-slate-600 text-sm mb-6">
          Sistema de Administración Inteligente para Tienda de Conveniencia
        </p>
        <Link
          href="/dashboard"
          className="inline-block w-full py-2.5 px-4 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Entrar al Dashboard
        </Link>
      </div>
    </div>
  );
}
