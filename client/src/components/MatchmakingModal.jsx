import { useEffect, useState } from "react";
import { Users, X, Clock, Hash } from "lucide-react";

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
      <div className="relative bg-gray-900 rounded-2xl p-6 max-w-sm w-full border-2 border-blue-500/50 shadow-[0_0_40px_rgba(59,130,246,0.3)]">
        {/* Botón cerrar */}
        <button
          onClick={onCancel}
          className="absolute top-3 right-3 bg-gray-800 hover:bg-gray-700 rounded-full p-1.5 transition-all active:scale-95"
          title="Cancelar búsqueda"
        >
          <X size={16} className="text-gray-400 hover:text-white" />
        </button>

        {/* Contenido */}
        <div className="flex flex-col items-center gap-4">
          {/* Icono animado */}
          <div className="relative">
            <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Users size={32} className="text-blue-400" />
            </div>
            {/* Anillo giratorio */}
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-500 animate-spin"></div>
          </div>

          {/* Título */}
          <div className="text-center">
            <h2 className="text-xl font-bold text-white mb-1">
              Buscando partida{dots}
            </h2>
            <p className="text-xs text-gray-400">
              Te emparejaremos con otros jugadores
            </p>
          </div>

          {/* Stats compactos */}
          <div className="w-full grid grid-cols-3 gap-2">
            {/* Tiempo */}
            <div className="bg-gray-800/50 rounded-lg p-2.5 flex flex-col items-center">
              <Clock size={14} className="text-blue-400 mb-1" />
              <span className="text-lg font-bold text-white">{waitSeconds}s</span>
              <span className="text-[9px] text-gray-500">Esperando</span>
            </div>

            {/* Posición */}
            <div className="bg-gray-800/50 rounded-lg p-2.5 flex flex-col items-center">
              <Hash size={14} className="text-purple-400 mb-1" />
              <span className="text-lg font-bold text-white">{status?.queuePosition || 0}</span>
              <span className="text-[9px] text-gray-500">Posición</span>
            </div>

            {/* Total en cola */}
            <div className="bg-gray-800/50 rounded-lg p-2.5 flex flex-col items-center">
              <Users size={14} className="text-green-400 mb-1" />
              <span className="text-lg font-bold text-white">{status?.totalInQueue || 0}</span>
              <span className="text-[9px] text-gray-500">En cola</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div className="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden mb-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-cyan-500 h-full transition-all duration-1000"
                style={{
                  width: `${Math.min((waitSeconds / 20) * 100, 100)}%`
                }}
              ></div>
            </div>

            {/* Mensaje dinámico */}
            <p className="text-[10px] text-center text-gray-500">
              {waitSeconds < 5 && "Buscando salas disponibles..."}
              {waitSeconds >= 5 && waitSeconds < 10 && "Revisando solicitudes de jugadores..."}
              {waitSeconds >= 10 && "Formando grupo automático..."}
            </p>
          </div>

          {/* Botón cancelar */}
          <button
            onClick={onCancel}
            className="w-full bg-red-500/30 hover:bg-red-500/40 px-4 py-2.5 rounded-lg font-semibold transition-all active:scale-95 text-red-300 text-sm"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
