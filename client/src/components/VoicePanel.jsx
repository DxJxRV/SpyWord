import { useEffect, useRef } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

/**
 * VoicePanel - Control de micrófono y visualizador de audio
 * @param {boolean} voiceEnabled - Sistema de voz activado
 * @param {boolean} micMuted - Micrófono silenciado
 * @param {boolean} speakersMuted - Audio silenciado
 * @param {Function} onToggleMuteMic - Callback al silenciar/activar micrófono
 * @param {Function} onToggleMuteSpeakers - Callback al silenciar/activar audio
 * @param {number} audioLevel - Nivel de audio actual (0-100)
 * @param {boolean} isConnecting - Si está conectando el micrófono
 * @param {string} voiceStatus - Estado de la conexión: 'disconnected', 'connecting', 'connected', 'error'
 * @param {Object} speakersData - Datos de quién está hablando {playerId: {isSpeaking, audioLevel}}
 * @param {Object} players - Todos los jugadores {playerId: {name, profilePicture, ...}}
 * @param {string} myId - ID del jugador actual
 */
export default function VoicePanel({
  voiceEnabled,
  micMuted = false,
  speakersMuted = false,
  onToggleMuteMic,
  onToggleMuteSpeakers,
  audioLevel = 0,
  isConnecting = false,
  voiceStatus = 'disconnected',
  speakersData = {},
  players = {},
  myId
}) {
  const canvasRef = useRef(null);

  // Calcular el nivel máximo de la sala (para normalizar visualización)
  const maxRoomLevel = Math.max(
    audioLevel, // Mi nivel
    ...Object.values(speakersData).map(d => d.audioLevel || 0) // Niveles remotos
  );

  // Nivel máximo de referencia (el más alto o mínimo 30 para tener algo de rango)
  const maxReference = Math.max(maxRoomLevel, 30);

  // Dibujar visualizador de audio en canvas
  useEffect(() => {
    if (!canvasRef.current || !voiceEnabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Dibujar barras de nivel
    const barCount = 20;
    const barWidth = width / barCount;
    // Normalizar basado en el máximo de la sala (rango dinámico)
    const normalizedLevel = Math.min(audioLevel / maxReference, 1);

    for (let i = 0; i < barCount; i++) {
      const barHeight = (i / barCount) <= normalizedLevel ? height * (i / barCount) : 0;

      // Gradiente de color: verde -> amarillo -> rojo
      let color;
      if (normalizedLevel < 0.5) {
        color = `rgb(34, 197, 94)`; // verde
      } else if (normalizedLevel < 0.8) {
        color = `rgb(234, 179, 8)`; // amarillo
      } else {
        color = `rgb(239, 68, 68)`; // rojo
      }

      ctx.fillStyle = color;
      ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
    }
  }, [audioLevel, voiceEnabled, maxReference, speakersData]);

  // Detectar si está hablando (nivel > 10)
  const isSpeaking = audioLevel > 10;

  // Encontrar quién está hablando actualmente con nivel significativo
  const SPEAKING_THRESHOLD = 10; // Nivel mínimo para mostrar (de 0-100) - Más sensible

  // Recopilar speakers remotos (solo filtrar por nivel, no por flag isSpeaking)
  const remoteSpeakers = Object.entries(speakersData)
    .filter(([, data]) => data.audioLevel > SPEAKING_THRESHOLD)
    .map(([playerId, data]) => ({ playerId, audioLevel: data.audioLevel }));

  // Agregar el usuario local si está hablando
  const allSpeakers = [...remoteSpeakers];
  if (audioLevel > SPEAKING_THRESHOLD && myId) {
    allSpeakers.push({ playerId: myId, audioLevel });
  }

  // Ordenar por nivel de audio (más alto primero)
  const currentSpeakers = allSpeakers.sort((a, b) => b.audioLevel - a.audioLevel);

  // Debug: Log de speakers y datos
  useEffect(() => {
    console.log('📊 speakersData completo:', speakersData);
    console.log('🎤 Mi audioLevel:', audioLevel, 'isSpeaking:', isSpeaking);
    console.log('👥 Current speakers filtered:', currentSpeakers);
  }, [speakersData, audioLevel, currentSpeakers]);

  if (!voiceEnabled) {
    return null; // No mostrar nada si no está habilitado
  }

  return (
    <div className="w-full bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-gray-700/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">🎤 Chat de Voz</span>

          {/* Indicador de estado */}
          {voiceStatus === 'connected' && (
            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]" title="Conectado" />
          )}
          {voiceStatus === 'connecting' && (
            <div className="flex items-center gap-1">
              <Loader2 size={12} className="text-yellow-400 animate-spin" />
              <span className="text-[10px] text-yellow-300 font-bold">Conectando</span>
            </div>
          )}
          {voiceStatus === 'error' && (
            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" title="Error" />
          )}
        </div>

        {/* Botones de control */}
        <div className="flex items-center gap-2">
          {/* Botón para silenciar micrófono */}
          <button
            onClick={onToggleMuteMic}
            disabled={isConnecting}
            className={`relative p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${
              micMuted
                ? 'bg-red-500/30 hover:bg-red-500/40'
                : `bg-green-500/30 hover:bg-green-500/40 ${isSpeaking ? 'ring-2 ring-green-400 animate-pulse' : ''}`
            }`}
            title={micMuted ? "Activar micrófono" : "Silenciar micrófono"}
          >
            {micMuted ? (
              <MicOff size={16} className="text-red-300" />
            ) : (
              <Mic size={16} className="text-green-300" />
            )}
            <span className="text-[10px] font-bold text-white">MIC</span>
          </button>

          {/* Botón para silenciar audio */}
          <button
            onClick={onToggleMuteSpeakers}
            disabled={isConnecting}
            className={`relative p-2 rounded-lg transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5 ${
              speakersMuted
                ? 'bg-red-500/30 hover:bg-red-500/40'
                : 'bg-blue-500/30 hover:bg-blue-500/40'
            }`}
            title={speakersMuted ? "Activar audio" : "Silenciar audio"}
          >
            {speakersMuted ? (
              <VolumeX size={16} className="text-red-300" />
            ) : (
              <Volume2 size={16} className="text-blue-300" />
            )}
            <span className="text-[10px] font-bold text-white">AUDIO</span>
          </button>
        </div>
      </div>

      {/* Quién está hablando */}
      <div className="px-3 py-2 bg-purple-500/10 border-b border-gray-700/50">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[10px] text-purple-300 font-bold">🗣️ Hablando:</span>

          {/* Mostrar mensaje si no hay nadie hablando */}
          {currentSpeakers.length === 0 ? (
            <span className="text-[10px] text-gray-500 italic">Nadie (threshold: {SPEAKING_THRESHOLD})</span>
          ) : (
            <>
            {/* Speakers activos */}
            {currentSpeakers.map(({ playerId: speakerId, audioLevel: speakerLevel }) => {
              const player = players[speakerId];
              if (!player) return null;

              // Normalizar nivel basado en el máximo de la sala
              const normalizedSpeakerLevel = (speakerLevel / maxReference) * 100;

              // Calcular intensidad del color basado en nivel normalizado
              const intensity = Math.min(normalizedSpeakerLevel / 100, 1);
              const bgOpacity = Math.round(20 + (intensity * 30)); // 20-50%

              // Determinar color según nivel normalizado
              let colorClass = 'bg-purple-500';
              let ringClass = 'ring-purple-400';
              if (normalizedSpeakerLevel > 70) {
                colorClass = 'bg-red-500';
                ringClass = 'ring-red-400';
              } else if (normalizedSpeakerLevel > 50) {
                colorClass = 'bg-yellow-500';
                ringClass = 'ring-yellow-400';
              } else if (normalizedSpeakerLevel > 35) {
                colorClass = 'bg-green-500';
                ringClass = 'ring-green-400';
              }

              return (
                <div
                  key={speakerId}
                  className={`flex items-center gap-1.5 ${colorClass}/${bgOpacity} rounded-full px-2 py-1 ring-2 ${ringClass} animate-pulse`}
                >
                  {/* Foto de perfil */}
                  {player.profilePicture ? (
                    <img
                      src={player.profilePicture}
                      alt={player.name}
                      className="w-5 h-5 rounded-full object-cover border border-white/50"
                    />
                  ) : (
                    <div className={`w-5 h-5 rounded-full ${colorClass} flex items-center justify-center text-[8px] text-white font-bold border border-white/50`}>
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                  )}

                  {/* Nombre */}
                  <span className="text-[10px] text-white font-bold">
                    {player.name.split(' ')[0]}
                    {speakerId === myId && <span className="opacity-70"> (tú)</span>}
                  </span>

                  {/* Indicador de nivel visual (barras) - Normalizado al máximo de la sala */}
                  <div className="flex items-center gap-[2px] ml-0.5">
                    {[...Array(3)].map((_, i) => {
                      // Normalizar el nivel del speaker basado en el máximo de la sala
                      const normalizedLevel = (speakerLevel / maxReference) * 100;
                      const barThreshold = (i + 1) * 33; // 33%, 66%, 100%
                      const isActive = normalizedLevel > barThreshold;
                      return (
                        <div
                          key={i}
                          className={`w-[2px] rounded-full transition-all ${
                            isActive
                              ? `bg-white h-${i === 0 ? '2' : i === 1 ? '3' : '4'}`
                              : 'bg-white/30 h-2'
                          }`}
                          style={{
                            height: isActive ? `${4 + i * 2}px` : '4px'
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              );
            })}
            </>
          )}
        </div>
      </div>

      {/* Visualizador de audio */}
      <div className="px-3 py-3">
        <div className="bg-gray-900/50 rounded-lg p-2 border border-gray-700/30">
          <canvas
            ref={canvasRef}
            width={240}
            height={40}
            className="w-full h-10 rounded"
          />

          {/* Indicador de nivel */}
          <div className="flex items-center justify-between mt-2">
            <span className="text-[10px] text-gray-400">
              {isSpeaking && !micMuted ? '🗣️ Hablando' : '🤫 Silencio'}
            </span>
            <span className="text-[10px] text-gray-400 font-mono">
              {audioLevel}%
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
