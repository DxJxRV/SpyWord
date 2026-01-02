import { Mic, MicOff } from "lucide-react";

/**
 * VoiceParticipant - Badge indicador de estado de voz de un jugador
 * Se puede usar como overlay sobre el avatar del jugador
 *
 * @param {boolean} isSpeaking - Si el jugador está hablando actualmente
 * @param {boolean} micEnabled - Si el jugador tiene el micrófono activado
 * @param {number} audioLevel - Nivel de audio del jugador (0-100)
 * @param {string} position - Posición del badge: 'bottom-right', 'bottom-left', 'top-right', 'top-left'
 */
export default function VoiceParticipant({
  isSpeaking = false,
  micEnabled = false,
  audioLevel = 0,
  position = 'bottom-right'
}) {
  // No mostrar nada si el micrófono no está activado
  if (!micEnabled) {
    return (
      <div className={`absolute ${getPositionClass(position)} z-10`}>
        <div className="bg-gray-900/90 rounded-full p-1 border border-gray-700">
          <MicOff size={10} className="text-gray-500" />
        </div>
      </div>
    );
  }

  // Determinar color del anillo según el nivel de audio
  let ringColor = 'ring-green-400';
  if (audioLevel > 50) {
    ringColor = 'ring-yellow-400';
  }
  if (audioLevel > 80) {
    ringColor = 'ring-red-400';
  }

  return (
    <div className={`absolute ${getPositionClass(position)} z-10`}>
      <div
        className={`bg-green-500/90 rounded-full p-1 border-2 border-white transition-all ${
          isSpeaking ? `ring-2 ${ringColor} scale-110 animate-pulse` : ''
        }`}
      >
        <Mic size={10} className="text-white" />
      </div>
    </div>
  );
}

/**
 * Obtiene la clase de Tailwind para posicionar el badge
 */
function getPositionClass(position) {
  switch (position) {
    case 'bottom-right':
      return 'bottom-0 right-0';
    case 'bottom-left':
      return 'bottom-0 left-0';
    case 'top-right':
      return 'top-0 right-0';
    case 'top-left':
      return 'top-0 left-0';
    default:
      return 'bottom-0 right-0';
  }
}

/**
 * VoiceSpeakingIndicator - Indicador simple de que alguien está hablando
 * Para usar en listas o grids sin necesidad de overlay
 */
export function VoiceSpeakingIndicator({ isSpeaking, audioLevel = 0 }) {
  if (!isSpeaking) return null;

  // Determinar color según nivel
  let colorClass = 'text-green-400';
  if (audioLevel > 50) colorClass = 'text-yellow-400';
  if (audioLevel > 80) colorClass = 'text-red-400';

  return (
    <div className="flex items-center gap-1 animate-pulse">
      <div className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
      <div className={`w-1.5 h-3 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
      <div className={`w-2 h-4 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
      <div className={`w-1.5 h-3 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
      <div className={`w-2 h-2 rounded-full ${colorClass.replace('text-', 'bg-')}`}></div>
    </div>
  );
}
