import { useEffect, useRef } from "react";
import { Mic, MicOff, Loader2 } from "lucide-react";

/**
 * VoicePanel - Control de micrófono y visualizador de audio
 * @param {boolean} micEnabled - Estado del micrófono (activado/desactivado)
 * @param {Function} onToggleMic - Callback al activar/desactivar micrófono
 * @param {number} audioLevel - Nivel de audio actual (0-100)
 * @param {boolean} isConnecting - Si está conectando el micrófono
 * @param {string} voiceStatus - Estado de la conexión: 'disconnected', 'connecting', 'connected', 'error'
 */
export default function VoicePanel({
  micEnabled,
  onToggleMic,
  audioLevel = 0,
  isConnecting = false,
  voiceStatus = 'disconnected'
}) {
  const canvasRef = useRef(null);

  // Dibujar visualizador de audio en canvas
  useEffect(() => {
    if (!canvasRef.current || !micEnabled) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;

    // Limpiar canvas
    ctx.clearRect(0, 0, width, height);

    // Dibujar barras de nivel
    const barCount = 20;
    const barWidth = width / barCount;
    const normalizedLevel = audioLevel / 100;

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
  }, [audioLevel, micEnabled]);

  const handleToggle = () => {
    if (isConnecting) return;
    onToggleMic();
  };

  // Detectar si está hablando (nivel > 15)
  const isSpeaking = audioLevel > 15;

  return (
    <div className="w-full bg-gray-800/50 rounded-lg border border-gray-700/50 overflow-hidden">
      {/* Header con botón de toggle */}
      <div className="flex items-center justify-between p-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-white">🎤 Micrófono</span>

          {/* Badge de estado */}
          {voiceStatus === 'connected' && (
            <span className="bg-green-500/30 text-green-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Conectado
            </span>
          )}
          {voiceStatus === 'connecting' && (
            <span className="bg-yellow-500/30 text-yellow-300 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
              <Loader2 size={10} className="animate-spin" />
              Conectando
            </span>
          )}
          {voiceStatus === 'error' && (
            <span className="bg-red-500/30 text-red-300 text-[10px] px-2 py-0.5 rounded-full font-bold">
              Error
            </span>
          )}
        </div>

        {/* Botón de toggle */}
        <button
          onClick={handleToggle}
          disabled={isConnecting}
          className={`relative p-2 rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
            micEnabled
              ? `bg-green-500/30 hover:bg-green-500/40 ${isSpeaking ? 'ring-2 ring-green-400 animate-pulse' : ''}`
              : 'bg-red-500/30 hover:bg-red-500/40'
          }`}
          title={micEnabled ? "Desactivar micrófono" : "Activar micrófono"}
        >
          {isConnecting ? (
            <Loader2 size={18} className="text-white animate-spin" />
          ) : micEnabled ? (
            <Mic size={18} className="text-green-300" />
          ) : (
            <MicOff size={18} className="text-red-300" />
          )}
        </button>
      </div>

      {/* Visualizador de audio (solo cuando está activo) */}
      {micEnabled && (
        <div className="px-3 pb-3">
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
                {isSpeaking ? '🗣️ Hablando' : '🤫 Silencio'}
              </span>
              <span className="text-[10px] text-gray-400 font-mono">
                {audioLevel}%
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
