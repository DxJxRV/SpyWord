import { useEffect, useState } from "react";
import { Loader2, Users, X } from "lucide-react";

/**
 * MatchmakingModal - Modal de búsqueda de partida
 * @param {boolean} isSearching - Si está buscando partida
 * @param {Function} onCancel - Callback al cancelar búsqueda
 * @param {Object} status - Estado actual: {matched, matchedRoomId, waitTime, queuePosition, totalInQueue}
 */
export default function MatchmakingModal({ isSearching, onCancel, status }) {
  const [dots, setDots] = useState('');

  // Animación de puntos suspensivos
  useEffect(() => {
    if (!isSearching) return;

    const interval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);

    return () => clearInterval(interval);
  }, [isSearching]);

  if (!isSearching) return null;

  const waitSeconds = status?.waitTime ? Math.floor(status.waitTime / 1000) : 0;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50">
      <div className="relative bg-gray-900 rounded-2xl p-8 max-w-md w-full border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]">
        {/* Botón cerrar */}
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 bg-gray-800 hover:bg-gray-700 rounded-full p-2 transition-all active:scale-95"
          title="Cancelar búsqueda"
        >
          <X size={18} className="text-gray-400 hover:text-white" />
        </button>

        {/* Contenido */}
        <div className="flex flex-col items-center gap-6">
          {/* Icono animado */}
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-purple-500/20 flex items-center justify-center animate-pulse">
              <Users size={40} className="text-purple-400" />
            </div>
            {/* Anillo giratorio */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-purple-500 animate-spin"></div>
          </div>

          {/* Título */}
          <div className="text-center">
            <h2 className="text-2xl font-bold text-white mb-2">
              Buscando partida{dots}
            </h2>
            <p className="text-sm text-gray-400">
              Estamos buscando jugadores para ti
            </p>
          </div>

          {/* Información de cola */}
          <div className="w-full bg-gray-800/50 rounded-lg p-4 space-y-3">
            {/* Tiempo de espera */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Tiempo esperando:</span>
              <span className="text-sm text-white font-bold">{waitSeconds}s</span>
            </div>

            {/* Posición en cola */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Posición en cola:</span>
              <span className="text-sm text-purple-400 font-bold">#{status?.queuePosition || 0}</span>
            </div>

            {/* Total en cola */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Jugadores esperando:</span>
              <span className="text-sm text-green-400 font-bold">{status?.totalInQueue || 0}</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
            <div
              className="bg-gradient-to-r from-purple-500 to-pink-500 h-full transition-all duration-1000"
              style={{
                width: `${Math.min((waitSeconds / 30) * 100, 100)}%`
              }}
            ></div>
          </div>

          {/* Mensaje dinámico */}
          <p className="text-xs text-center text-gray-500">
            {waitSeconds < 10 && "Buscando salas públicas disponibles..."}
            {waitSeconds >= 10 && waitSeconds < 30 && "Buscando salas con solicitudes de jugadores..."}
            {waitSeconds >= 30 && "Formando grupo con otros jugadores..."}
          </p>

          {/* Botón cancelar */}
          <button
            onClick={onCancel}
            className="w-full bg-red-500/30 hover:bg-red-500/40 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 text-red-300"
          >
            Cancelar búsqueda
          </button>
        </div>
      </div>
    </div>
  );
}
