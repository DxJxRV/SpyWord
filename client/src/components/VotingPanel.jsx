import { useState } from "react";
import { toast } from "sonner";
import { Vote, UserX, CheckCircle, XCircle, Users, AlertTriangle, Play, Phone, Eye, EyeOff } from "lucide-react";
import { api, buildImageUrl } from "../services/api";

export default function VotingPanel({ roomState, roomId, myId, word, wordHidden, setWordHidden, modeType, itemImageUrl, onUpdate }) {
  const [loading, setLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  const { status, players, votesTally, votersRemaining, eliminatedPlayerId, isAdmin } = roomState;

  // Check if current player is alive
  const amIAlive = players[myId]?.isAlive !== false;
  const hasIVoted = players[myId]?.hasVoted || false;

  // Get list of alive players (excluding myself)
  const alivePlayers = Object.entries(players)
    .filter(([id, player]) => player.isAlive !== false && id !== myId)
    .map(([id, player]) => ({ id, name: player.name }));

  // Handle calling a vote
  const handleCallVote = async () => {
    if (!amIAlive) {
      toast.error("No puedes llamar a votación si estás eliminado");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/rooms/${roomId}/call_vote`);
      toast.success("¡Votación iniciada!");
      onUpdate?.(); // Trigger state refresh
    } catch (error) {
      console.error("Error al iniciar votación:", error);
      toast.error(error.response?.data?.error || "Error al iniciar votación");
    } finally {
      setLoading(false);
    }
  };

  // Handle casting a vote
  const handleVote = async () => {
    if (!selectedPlayer) {
      toast.error("Selecciona un jugador para votar");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/rooms/${roomId}/vote`, {
        targetId: selectedPlayer,
      });
      toast.success("Voto registrado");
      setSelectedPlayer(null);
      onUpdate?.(); // Trigger state refresh
    } catch (error) {
      console.error("Error al votar:", error);
      toast.error(error.response?.data?.error || "Error al registrar voto");
    } finally {
      setLoading(false);
    }
  };

  // Handle continuing game after results
  const handleContinue = async () => {
    if (!isAdmin) {
      toast.error("Solo el admin puede continuar el juego");
      return;
    }

    try {
      setLoading(true);
      await api.post(`/rooms/${roomId}/continue_game`);
      toast.success("Continuando el juego...");
      onUpdate?.(); // Trigger state refresh
    } catch (error) {
      console.error("Error al continuar:", error);
      toast.error(error.response?.data?.error || "Error al continuar");
    } finally {
      setLoading(false);
    }
  };

  // Calculate majority needed
  const aliveCount = Object.values(players).filter((p) => p.isAlive !== false).length;
  const majorityNeeded = Math.ceil(aliveCount / 2);

  // ========== IN_GAME STATUS ==========
  if (status === "IN_GAME") {
    if (!amIAlive) {
      return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
          <div className="flex items-center gap-3 text-gray-400">
            <UserX size={24} />
            <p>Has sido eliminado. Espera a que termine la partida.</p>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={handleCallVote}
        disabled={loading}
        className="w-full h-full bg-purple-500 hover:bg-purple-600 px-6 py-3 rounded-xl font-semibold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex flex-col items-center justify-center gap-2"
      >
        <Phone size={28} />
        <span className="text-sm">{loading ? "Votando..." : "Votar"}</span>
      </button>
    );
  }

  // ========== VOTING STATUS ==========
  if (status === "VOTING") {
    if (!amIAlive) {
      return (
        <div className="bg-gray-800/50 backdrop-blur-sm p-6 rounded-xl border border-gray-700">
          <div className="flex flex-col items-center text-center gap-4">
            <UserX size={32} className="text-gray-500" />
            <div>
              <h3 className="text-xl font-bold text-gray-300">Estás eliminado</h3>
              <p className="text-gray-400 mt-2">Los jugadores activos están votando...</p>
            </div>
            <div className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
              <p className="text-sm text-blue-300">
                <Users size={16} className="inline mr-1" />
                {votersRemaining} {votersRemaining === 1 ? "jugador falta" : "jugadores faltan"} por votar
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (hasIVoted) {
      return (
        <div className="bg-gradient-to-br from-emerald-600/20 to-green-600/20 p-6 rounded-xl border-2 border-emerald-500/50">
          <div className="flex flex-col items-center text-center gap-4">
            <CheckCircle size={48} className="text-emerald-400" />
            <div>
              <h3 className="text-2xl font-bold text-emerald-300">Voto registrado</h3>
              <p className="text-gray-300 mt-2">Esperando a que los demás jugadores voten...</p>
            </div>
            <div className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
              <p className="text-sm text-blue-300">
                <Users size={16} className="inline mr-1" />
                {votersRemaining} {votersRemaining === 1 ? "jugador falta" : "jugadores faltan"} por votar
              </p>
            </div>
          </div>

          {/* Show current vote tallies */}
          {Object.keys(votesTally).length > 0 && (
            <div className="mt-6 pt-6 border-t border-emerald-500/30">
              <h4 className="text-sm font-semibold text-emerald-300 mb-3">Conteo parcial de votos:</h4>
              <div className="space-y-2">
                {Object.entries(votesTally).map(([playerId, count]) => (
                  <div key={playerId} className="bg-gray-800/50 px-4 py-2 rounded-lg flex justify-between items-center">
                    <span className="text-white font-medium">{players[playerId]?.name || "Desconocido"}</span>
                    <span className="bg-purple-500/30 px-3 py-1 rounded-full text-sm font-bold text-purple-300">
                      {count} {count === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-3 text-center">
                Se necesitan {majorityNeeded} votos para eliminar a un jugador
              </p>
            </div>
          )}
        </div>
      );
    }

    // Show voting interface - Estilo "pasa y juega"
    const playerColors = ['bg-rose-500', 'bg-indigo-500', 'bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-cyan-500', 'bg-pink-500', 'bg-orange-500'];

    return (
      <div className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl border border-purple-500/40 shadow-lg p-4">
        {/* Mostrar palabra compacta arriba */}
        <div className="relative bg-gray-800/50 rounded-lg border border-purple-500/30 p-3 mb-4">
          {/* Botón ocultar/mostrar */}
          <button
            onClick={() => setWordHidden?.(!wordHidden)}
            className="absolute top-2 right-2 bg-purple-500/30 hover:bg-purple-500/50 rounded-full transition-all text-white p-1.5"
            title={wordHidden ? "Mostrar palabra" : "Ocultar palabra"}
          >
            {wordHidden ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>

          <div className="flex items-center justify-center gap-2">
            <p className="text-xs text-purple-300">{modeType === 'image' ? 'Tu imagen:' : 'Tu palabra:'}</p>
            {wordHidden ? (
              <h1 className="text-xl font-bold text-white">***</h1>
            ) : (
              <>
                {itemImageUrl && word !== "???" && (
                  <img
                    src={buildImageUrl(itemImageUrl)}
                    alt={word}
                    className="h-10 w-10 object-cover rounded-lg border-2 border-purple-400"
                  />
                )}
                {(modeType !== 'image' || !itemImageUrl || word === "???") && (
                  <h1 className="text-xl font-bold text-white">
                    {word || "..."}
                  </h1>
                )}
              </>
            )}
            {!wordHidden && word === "???" && (
              <span className="text-amber-400 text-xs font-semibold">🕵️</span>
            )}
          </div>
        </div>

        {/* Header de votación */}
        <div className="mb-3 text-center">
          <h3 className="text-sm font-bold text-red-300 mb-1">¿Quién es el impostor?</h3>
          <p className="text-[10px] text-gray-400">
            {votersRemaining}/{aliveCount} pendientes • {majorityNeeded} votos para eliminar
          </p>
        </div>

        {/* Grid de jugadores - estilo grande como pasa y juega */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {alivePlayers.map(({ id, name }, index) => {
            const playerColor = playerColors[index % playerColors.length];
            const playerData = players[id];
            const profilePicture = playerData?.profilePicture;

            return (
              <button
                key={id}
                onClick={() => {
                  setSelectedPlayer(id);
                  if (navigator.vibrate) navigator.vibrate(25);
                }}
                className={`${playerColor} h-24 rounded-xl flex flex-col items-center justify-center gap-2 text-base font-bold transition-all relative overflow-hidden
                  ${selectedPlayer === id ? "scale-105 ring-4 ring-white shadow-2xl" : "hover:scale-105"}`}
              >
                {/* Foto de perfil o avatar */}
                {profilePicture ? (
                  <img
                    src={profilePicture}
                    alt={name}
                    className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-white/20 border-2 border-white flex items-center justify-center text-2xl font-bold shadow-lg">
                    {name.charAt(0).toUpperCase()}
                  </div>
                )}

                <span className="text-white drop-shadow-lg text-sm">{name}</span>

                {/* Badge de votos */}
                {votesTally[id] && votesTally[id] > 0 && (
                  <span className="absolute top-2 right-2 bg-black/50 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-bold text-white">
                    {votesTally[id]} 🗳️
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Botón de confirmar o mensaje */}
        {selectedPlayer ? (
          <button
            onClick={handleVote}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 px-4 py-3 rounded-xl font-bold transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-white"
          >
            {loading ? "Votando..." : `Votar por ${alivePlayers.find(p => p.id === selectedPlayer)?.name}`}
          </button>
        ) : (
          <div className="w-full bg-gray-700/30 px-4 py-3 rounded-xl border-2 border-dashed border-gray-600 flex items-center justify-center">
            <p className="text-xs text-gray-400">Selecciona un jugador</p>
          </div>
        )}
      </div>
    );
  }

  // ========== RESULTS STATUS ==========
  if (status === "RESULTS") {
    const wasEliminated = eliminatedPlayerId !== null;
    const eliminatedPlayer = wasEliminated ? players[eliminatedPlayerId] : null;

    return (
      <div
        className={`p-6 rounded-xl border-2 ${
          wasEliminated
            ? "bg-gradient-to-br from-red-600/20 to-orange-600/20 border-red-500/50"
            : "bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border-blue-500/50"
        }`}
      >
        <div className="flex flex-col items-center text-center gap-4 mb-6">
          {wasEliminated ? (
            <>
              <XCircle size={64} className="text-red-400" />
              <div>
                <h3 className="text-3xl font-bold text-red-300 mb-2">¡Jugador Eliminado!</h3>
                <p className="text-xl text-white">
                  <span className="font-bold">{eliminatedPlayer?.name}</span> ha sido eliminado por mayoría de votos
                </p>
              </div>
            </>
          ) : (
            <>
              <CheckCircle size={64} className="text-blue-400" />
              <div>
                <h3 className="text-3xl font-bold text-blue-300 mb-2">Empate o Sin Mayoría</h3>
                <p className="text-xl text-white">No se alcanzó la mayoría necesaria. Nadie fue eliminado.</p>
              </div>
            </>
          )}
        </div>

        {/* Vote results breakdown */}
        {Object.keys(votesTally).length > 0 && (
          <div className="bg-gray-800/50 backdrop-blur-sm p-4 rounded-xl mb-6">
            <h4 className="text-sm font-semibold text-gray-300 mb-3 text-center">Resultados de la votación:</h4>
            <div className="space-y-2">
              {Object.entries(votesTally)
                .sort(([, a], [, b]) => b - a)
                .map(([playerId, count]) => (
                  <div
                    key={playerId}
                    className={`px-4 py-2 rounded-lg flex justify-between items-center ${
                      playerId === eliminatedPlayerId ? "bg-red-500/30 border border-red-500/50" : "bg-gray-700/50"
                    }`}
                  >
                    <span className="text-white font-medium">{players[playerId]?.name || "Desconocido"}</span>
                    <span className="bg-purple-500/30 px-3 py-1 rounded-full text-sm font-bold text-purple-300">
                      {count} {count === 1 ? "voto" : "votos"}
                    </span>
                  </div>
                ))}
            </div>
            <p className="text-xs text-gray-400 mt-3 text-center">
              Se necesitaban {majorityNeeded} votos para eliminar
            </p>
          </div>
        )}

        {/* Continue button (admin only) */}
        {isAdmin && (
          <button
            onClick={handleContinue}
            disabled={loading}
            className="w-full bg-emerald-500 hover:bg-emerald-600 px-6 py-4 rounded-xl font-bold text-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            <Play size={24} />
            <span>{loading ? "Continuando..." : "Continuar Partida"}</span>
          </button>
        )}

        {!isAdmin && (
          <p className="text-center text-gray-400 text-sm">
            Esperando a que el administrador continúe el juego...
          </p>
        )}
      </div>
    );
  }

  return null;
}
