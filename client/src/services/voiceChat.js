/**
 * Voice Chat Service
 * Maneja la captura de audio del micrófono y análisis de nivel de audio
 */

let localStream = null;
let audioContext = null;
let analyser = null;
let microphone = null;

/**
 * Inicializa el micrófono y obtiene el stream de audio
 * @returns {Promise<MediaStream>} Stream de audio local
 */
export async function initMicrophone() {
  try {
    // Solicitar acceso al micrófono
    localStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
      video: false,
    });

    // Crear contexto de audio para análisis
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;

    microphone = audioContext.createMediaStreamSource(localStream);
    microphone.connect(analyser);

    console.log("🎤 Micrófono inicializado correctamente");
    return localStream;
  } catch (error) {
    console.error("❌ Error al acceder al micrófono:", error);
    throw error;
  }
}

/**
 * Obtiene el nivel de audio actual (0-100)
 * @returns {number} Nivel de audio normalizado entre 0 y 100
 */
export function getAudioLevel() {
  if (!analyser) return 0;

  const dataArray = new Uint8Array(analyser.frequencyBinCount);
  analyser.getByteFrequencyData(dataArray);

  // Calcular promedio de frecuencias
  const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;

  // Normalizar a escala 0-100
  return Math.min(100, Math.round(average / 2.55));
}

/**
 * Detecta si el usuario está hablando
 * @param {number} threshold - Umbral mínimo para considerar que está hablando (default: 15)
 * @returns {boolean} true si está hablando
 */
export function isSpeaking(threshold = 15) {
  const level = getAudioLevel();
  return level > threshold;
}

/**
 * Obtiene el stream de audio local
 * @returns {MediaStream|null} Stream actual o null si no está inicializado
 */
export function getLocalStream() {
  return localStream;
}

/**
 * Silencia/activa el micrófono
 * @param {boolean} muted - true para silenciar, false para activar
 */
export function setMuted(muted) {
  if (!localStream) return;

  localStream.getAudioTracks().forEach(track => {
    track.enabled = !muted;
  });

  console.log(`🎤 Micrófono ${muted ? 'silenciado' : 'activado'}`);
}

/**
 * Detiene el micrófono y libera recursos
 */
export function stopMicrophone() {
  if (localStream) {
    localStream.getTracks().forEach(track => track.stop());
    localStream = null;
  }

  if (microphone) {
    microphone.disconnect();
    microphone = null;
  }

  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }

  analyser = null;
  console.log("🎤 Micrófono detenido y recursos liberados");
}

/**
 * Verifica si el micrófono está activo
 * @returns {boolean} true si el micrófono está activo
 */
export function isMicrophoneActive() {
  return localStream !== null && localStream.active;
}
