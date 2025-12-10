import { useZxing } from "react-zxing";
import { X, Camera as CameraIcon } from "lucide-react";
import { useState } from "react";

export default function QRScanner({ onScan, onClose }) {
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const { ref } = useZxing({
    paused: false,
    constraints: {
      video: true, // Usar cualquier cámara disponible
    },
    timeBetweenDecodingAttempts: 300,
    onDecodeResult(result) {
      const scannedText = result.getText();
      console.log("QR detectado:", scannedText);
      setResult(scannedText);

      // Extraer el código de sala del URL o del texto escaneado
      let roomCode = null;

      // Si es un URL completo (https://impostorword.com/#/?join=ABCDEF)
      if (scannedText.includes("join=")) {
        const match = scannedText.match(/join=([A-Z0-9]{6})/i);
        if (match) {
          roomCode = match[1].toUpperCase();
        }
      }
      // Si es solo el código (ABCDEF)
      else if (/^[A-Z0-9]{6}$/i.test(scannedText)) {
        roomCode = scannedText.toUpperCase();
      }

      if (roomCode) {
        onScan(roomCode);
      } else {
        setError("QR no válido. Debe ser un código de sala.");
      }
    },
    onDecodeError(error) {
      // Silenciar errores de decodificación normales (cuando no hay QR visible)
      // console.log("No QR detected:", error);
    },
    onError(error) {
      console.error("Error de cámara:", error);
      setError("No se pudo acceder a la cámara. Verifica los permisos.");
    },
  });

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-sm flex flex-col items-center justify-center p-6 z-50">
      {/* Header con botón cerrar */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Escanear QR</h2>
        <button
          onClick={onClose}
          className="bg-red-500/20 hover:bg-red-500/30 text-red-400 p-2 rounded-lg transition-all"
        >
          <X size={24} />
        </button>
      </div>

      {/* Video preview */}
      <div className="bg-gray-900 rounded-2xl overflow-hidden border-4 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)] w-full max-w-md aspect-square relative">
        <video
          ref={ref}
          className="w-full h-full object-cover"
          autoPlay
          playsInline
          muted
        />

        {/* Overlay de guía */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-64 h-64 border-4 border-purple-500/50 rounded-2xl shadow-[0_0_20px_rgba(168,85,247,0.5)]"></div>
        </div>
      </div>

      {/* Instrucciones y mensajes */}
      <div className="mt-6 max-w-md w-full space-y-3">
        {!error && !result && (
          <div className="bg-purple-500/20 px-4 py-3 rounded-lg border border-purple-500/30">
            <p className="text-sm text-purple-200 text-center">
              📱 Apunta tu cámara al código QR para unirte automáticamente
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-500/20 px-4 py-3 rounded-lg border border-red-500/30">
            <p className="text-xs text-red-300 mb-1">❌ Error</p>
            <p className="text-sm text-white">{error}</p>
          </div>
        )}

        {result && !error && (
          <div className="bg-emerald-500/20 px-4 py-3 rounded-lg border border-emerald-500/30">
            <p className="text-xs text-emerald-300 mb-1">✅ Código detectado</p>
            <p className="text-sm text-white font-mono">{result}</p>
          </div>
        )}
      </div>
    </div>
  );
}
