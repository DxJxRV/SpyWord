import { Trophy, Skull, RotateCw, Heart, Ghost } from "lucide-react";
import AdPlaceholder from "./AdPlaceholder";

export default function GameOverPanel({ roomState, roomId, myId, onRestart, isPremium = false }) {
  const { winner, winReason, players, impostorId, isAdmin } = roomState;

  const impostorName = players[impostorId]?.name || "Desconocido";
  const wasITheImpostor = myId === impostorId;

  return (
    <div className="space-y-4">
      {/* Hero Section - Fondo de color completo */}
      <div
        className={`-mx-6 px-6 py-8 ${
          winner === 'IMPOSTOR'
            ? 'bg-gradient-to-br from-red-600 to-red-700'
            : 'bg-gradient-to-br from-emerald-600 to-emerald-700'
        }`}
      >
        <div className="flex flex-col items-center text-center gap-4">
          {/* Icono grande */}
          {winner === 'IMPOSTOR' ? (
            <Skull size={72} className="text-white" strokeWidth={2} />
          ) : (
            <Trophy size={72} className="text-white" strokeWidth={2} />
          )}

          {/* Título gigante */}
          <h1 className="text-4xl md:text-5xl font-bold text-white">
            {winner === 'IMPOSTOR' ? '¡VICTORIA DEL IMPOSTOR!' : '¡VICTORIA!'}
          </h1>

          {/* Subtítulo con el impostor */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 w-full max-w-sm">
            <p className="text-sm text-white/80 mb-2">El impostor era:</p>

            {/* Avatar del impostor */}
            <div className="flex items-center justify-center gap-3">
              {players[impostorId]?.profilePicture ? (
                <img
                  src={players[impostorId].profilePicture}
                  alt={impostorName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-900 border-2 border-white flex items-center justify-center text-2xl font-bold text-white">
                  {impostorName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="text-left">
                <p className="text-2xl font-bold text-white">{impostorName}</p>
                {wasITheImpostor && (
                  <p className="text-yellow-300 text-sm font-semibold animate-pulse">
                    🕵️ ¡Eras tú!
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Razón corta */}
          <p className="text-white/80 text-sm mb-4">
            {winReason === 'impostor_eliminated' && 'Fue eliminado por votación'}
            {winReason === 'impostor_survived' && 'Sobrevivió hasta el final'}
          </p>

          {/* Botón de reinicio (solo admin) */}
          {isAdmin ? (
            <button
              onClick={onRestart}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm px-8 py-3 rounded-xl font-bold text-lg transition-all active:scale-95 flex items-center justify-center gap-2 text-white border-2 border-white/30"
            >
              <RotateCw size={24} />
              <span>Jugar de Nuevo</span>
            </button>
          ) : (
            <div className="bg-white/10 backdrop-blur-sm px-6 py-3 rounded-xl text-white/80 text-sm border border-white/20">
              <p>Esperando a que el administrador reinicie el juego...</p>
            </div>
          )}
        </div>
      </div>

      {/* Grid de jugadores finales */}
      <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl border border-gray-700">
        <h3 className="text-lg font-bold text-gray-200 mb-3 text-center">Jugadores Finales</h3>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {Object.entries(players).map(([playerId, player]) => {
            const isImpostor = playerId === impostorId;
            const isAlive = player.isAlive !== false;
            const isMe = playerId === myId;

            return (
              <div
                key={playerId}
                className={`relative p-3 rounded-xl flex flex-col items-center gap-2 transition-all ${
                  isImpostor
                    ? 'bg-red-500/20 border-2 border-red-500'
                    : isAlive
                    ? 'bg-emerald-500/10 border-2 border-emerald-500/30'
                    : 'bg-gray-700/30 border-2 border-gray-600 opacity-60'
                }`}
              >
                {/* Badge de estado */}
                <div className="absolute top-1.5 right-1.5">
                  {isImpostor ? (
                    <span className="text-red-400 text-lg">🕵️</span>
                  ) : isAlive ? (
                    <Heart size={14} className="text-emerald-400" fill="currentColor" />
                  ) : (
                    <Ghost size={14} className="text-gray-400" />
                  )}
                </div>

                {/* Avatar */}
                {player.profilePicture ? (
                  <img
                    src={player.profilePicture}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${
                      isImpostor
                        ? 'bg-red-500 text-white'
                        : isAlive
                        ? 'bg-emerald-500/30 text-emerald-200'
                        : 'bg-gray-600 text-gray-300'
                    }`}
                  >
                    {player.name.charAt(0).toUpperCase()}
                  </div>
                )}

                {/* Nombre */}
                <span className="text-xs text-center truncate w-full text-white font-medium">
                  {player.name}
                  {isMe && <span className="text-blue-400"> (Tú)</span>}
                </span>

                {/* Status badge */}
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    isImpostor
                      ? 'bg-red-500/50 text-red-100'
                      : isAlive
                      ? 'bg-emerald-500/30 text-emerald-200'
                      : 'bg-gray-600/50 text-gray-300'
                  }`}
                >
                  {isImpostor ? 'Impostor' : isAlive ? 'Vivo' : 'Eliminado'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Banner Publicitario */}
      <div className="flex justify-center">
        <AdPlaceholder isPremium={isPremium} format="horizontal" />
      </div>
    </div>
  );
}
