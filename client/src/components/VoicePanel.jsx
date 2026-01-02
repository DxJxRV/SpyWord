import { useEffect, useRef, useState, useMemo } from "react";
import { Mic, MicOff, Volume2, VolumeX, Loader2 } from "lucide-react";

/**
 * VoicePanel - Control de micrófono y visualizador de audio
 * @param {boolean} voiceEnabled - Sistema de voz activado
 * @param {boolean} micMuted - Micrófono silenciado
 * @param {boolean} speakersMuted - Audio silenciado
 * @param {Function} onToggleMuteMic - Callback al silenciar/activar micrófono
 * @param {Function} onToggleMuteSpeakers - Callback al silenciar/activar audio
 * @param {Function} onEnableVoice - Callback para activar chat de voz por primera vez
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
  onEnableVoice,
  audioLevel = 0,
  isConnecting = false,
  voiceStatus = 'disconnected',
  speakersData = {},
  players = {},
  myId
}) {
  const canvasRef = useRef(null);

  // Estado para speakers con delay de salida
  const [displayedSpeakers, setDisplayedSpeakers] = useState([]);
  const speakerTimersRef = useRef({}); // {playerId: timeoutId}
  const speakerColorsRef = useRef({}); // {playerId: {colorClass, ringClass}} para mantener colores consistentes

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

  // Detectar si está hablando (nivel > 4)
  const isSpeaking = audioLevel > 4;

  // Encontrar quién está hablando actualmente con nivel significativo
  const SPEAKING_THRESHOLD = 4; // Nivel mínimo para mostrar (de 0-100) - Muy sensible

  // Memorizar currentSpeakers para evitar loops infinitos
  const currentSpeakers = useMemo(() => {
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
    return allSpeakers.sort((a, b) => b.audioLevel - a.audioLevel);
  }, [speakersData, audioLevel, myId]);

  // Efecto: Gestionar speakers con delay de 0.5s al dejar de hablar
  useEffect(() => {
    const REMOVE_DELAY = 500; // 0.5 segundos

    // IDs de speakers actualmente hablando
    const activeSpeakerIds = currentSpeakers.map(s => s.playerId);

    // 1. Agregar nuevos speakers inmediatamente
    activeSpeakerIds.forEach(playerId => {
      // Si está hablando y tiene un timer de remoción, cancelarlo
      if (speakerTimersRef.current[playerId]) {
        clearTimeout(speakerTimersRef.current[playerId]);
        delete speakerTimersRef.current[playerId];
      }

      // Asignar color consistente si es nuevo
      if (!speakerColorsRef.current[playerId]) {
        const colors = [
          { bg: 'bg-purple-500', ring: 'ring-purple-400' },
          { bg: 'bg-green-500', ring: 'ring-green-400' },
          { bg: 'bg-blue-500', ring: 'ring-blue-400' },
          { bg: 'bg-pink-500', ring: 'ring-pink-400' },
          { bg: 'bg-indigo-500', ring: 'ring-indigo-400' },
        ];
        const hash = playerId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        speakerColorsRef.current[playerId] = colors[hash % colors.length];
      }
    });

    // 2. Configurar timers para speakers que dejaron de hablar
    const currentDisplayed = displayedSpeakers.map(s => s.playerId);
    currentDisplayed.forEach(playerId => {
      // Si estaba mostrado pero ya no está hablando
      if (!activeSpeakerIds.includes(playerId) && !speakerTimersRef.current[playerId]) {
        // Crear timer para quitarlo después de 1.5s
        speakerTimersRef.current[playerId] = setTimeout(() => {
          setDisplayedSpeakers(prev => prev.filter(s => s.playerId !== playerId));
          delete speakerTimersRef.current[playerId];
          delete speakerColorsRef.current[playerId]; // Limpiar color también
        }, REMOVE_DELAY);
      }
    });

    // 3. Actualizar displayedSpeakers con los que están hablando
    setDisplayedSpeakers(prev => {
      const newSpeakers = [...currentSpeakers];

      // Mantener los que tienen timer pendiente (aún no removidos)
      prev.forEach(speaker => {
        if (!newSpeakers.find(s => s.playerId === speaker.playerId) && speakerTimersRef.current[speaker.playerId]) {
          newSpeakers.push(speaker);
        }
      });

      return newSpeakers;
    });
  }, [currentSpeakers]);

  // Cleanup de timers al desmontar
  useEffect(() => {
    return () => {
      Object.values(speakerTimersRef.current).forEach(timer => clearTimeout(timer));
    };
  }, []);

  // Si no está activado, mostrar botón para activar
  if (!voiceEnabled) {
    return (
      <div className="w-full bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
        <div className="p-4 flex flex-col items-center gap-3">
          <div className="text-center">
            <h3 className="text-sm font-semibold text-white mb-1">🎤 Chat de Voz</h3>
            <p className="text-xs text-gray-400">Habla con otros jugadores en tiempo real</p>
          </div>

          <button
            onClick={onEnableVoice}
            disabled={isConnecting}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 px-6 py-3 rounded-lg font-semibold transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isConnecting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                <span>Conectando...</span>
              </>
            ) : (
              <>
                <Mic size={18} />
                <span>Activar Chat de Voz</span>
              </>
            )}
          </button>

          <p className="text-[10px] text-gray-500 text-center">
            Se solicitará permiso para usar tu micrófono
          </p>
        </div>
      </div>
    );
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

      {/* Quién está hablando - Solo mostrar cuando hay speakers */}
      {displayedSpeakers.length > 0 && (
        <div className="px-3 py-2 bg-purple-500/10 border-b border-gray-700/50">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-purple-300 font-bold">🗣️ Hablando:</span>
            {displayedSpeakers
              .sort((a, b) => b.audioLevel - a.audioLevel)
              .map(({ playerId: speakerId, audioLevel: speakerLevel }) => {
                const player = players[speakerId];
                if (!player) return null;

                // Usar color consistente guardado (no recalcular)
                const { bg: colorClass, ring: ringClass } = speakerColorsRef.current[speakerId] || {
                  bg: 'bg-purple-500',
                  ring: 'ring-purple-400'
                };

                // Calcular opacidad basada en nivel
                const normalizedSpeakerLevel = (speakerLevel / maxReference) * 100;
                const intensity = Math.min(normalizedSpeakerLevel / 100, 1);
                const bgOpacity = Math.round(20 + (intensity * 30)); // 20-50%

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
          </div>
        </div>
      )}

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
