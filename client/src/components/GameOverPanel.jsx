import { Trophy, Target, Users, RotateCw } from "lucide-react";
import AdPlaceholder from "./AdPlaceholder";

export default function GameOverPanel({ roomState, roomId, myId, onRestart, isPremium = false }) {
  const { winner, winReason, players, impostorId, isAdmin } = roomState;

  const impostorName = players[impostorId]?.name || "Desconocido";
  const wasITheImpostor = myId === impostorId;

  return (
    <div
      className={`p-8 rounded-2xl border-2 ${
        winner === 'IMPOSTOR'
          ? 'bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/50'
          : 'bg-gradient-to-br from-emerald-600/20 to-green-600/20 border-emerald-500/50'
      }`}
    >
      {/* Título de victoria */}
      <div className="flex flex-col items-center text-center gap-6 mb-8">
        <Trophy size={80} className={winner === 'IMPOSTOR' ? 'text-red-400' : 'text-emerald-400'} />

        <div>
          <h2 className="text-4xl font-bold mb-4">
            {winner === 'IMPOSTOR' ? (
              <span className="text-red-300">¡Victoria del Impostor!</span>
            ) : (
              <span className="text-emerald-300">¡Victoria de los Jugadores!</span>
            )}
          </h2>

          <p className="text-xl text-gray-200 mb-2">
            {winReason === 'impostor_eliminated' && '¡El impostor fue eliminado!'}
            {winReason === 'impostor_survived' && '¡El impostor sobrevivió hasta el final!'}
          </p>
        </div>
      </div>

      {/* Revelar impostor */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Target size={28} className="text-red-400" />
          <h3 className="text-2xl font-bold text-red-300">El Impostor era:</h3>
        </div>

        <div className={`text-center py-4 px-6 rounded-lg ${
          wasITheImpostor
            ? 'bg-red-500/30 border-2 border-red-500'
            : 'bg-gray-700/50'
        }`}>
          <p className="text-3xl font-bold text-white mb-1">{impostorName}</p>
          {wasITheImpostor && (
            <p className="text-red-300 text-sm font-semibold animate-pulse">
              🕵️ ¡Eras tú!
            </p>
          )}
        </div>
      </div>

      {/* Lista de jugadores supervivientes */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700 mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Users size={24} className="text-blue-400" />
          <h3 className="text-xl font-bold text-blue-300">Jugadores Finales</h3>
        </div>

        <div className="space-y-2">
          {Object.entries(players).map(([playerId, player]) => (
            <div
              key={playerId}
              className={`px-4 py-3 rounded-lg flex items-center justify-between ${
                playerId === impostorId
                  ? 'bg-red-500/20 border border-red-500/50'
                  : player.isAlive
                  ? 'bg-emerald-500/20 border border-emerald-500/50'
                  : 'bg-gray-700/50 opacity-60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-white font-medium">{player.name}</span>
                {playerId === impostorId && (
                  <span className="text-red-400 text-xs font-bold">🕵️ IMPOSTOR</span>
                )}
                {playerId === myId && (
                  <span className="text-blue-400 text-xs font-bold">(Tú)</span>
                )}
              </div>
              <span className={`text-sm font-semibold ${
                player.isAlive ? 'text-emerald-400' : 'text-gray-400'
              }`}>
                {player.isAlive ? '✓ Vivo' : '✗ Eliminado'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Banner Publicitario */}
      <div className="flex justify-center mb-6">
        <AdPlaceholder isPremium={isPremium} format="horizontal" />
      </div>

      {/* Botón de reinicio (solo admin) */}
      {isAdmin ? (
        <button
          onClick={onRestart}
          className="w-full bg-emerald-500 hover:bg-emerald-600 px-6 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          <RotateCw size={24} />
          <span>Jugar de Nuevo</span>
        </button>
      ) : (
        <div className="text-center text-gray-400 text-sm">
          <p>Esperando a que el administrador reinicie el juego...</p>
        </div>
      )}
    </div>
  );
}
