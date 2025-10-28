import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "../services/api";

export default function Room() {
  const { roomId } = useParams(); // Solo necesitamos roomId
  const navigate = useNavigate();
  const [word, setWord] = useState("");
  const [currentRound, setCurrentRound] = useState(1);
  const [totalPlayers, setTotalPlayers] = useState(0);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [countdown, setCountdown] = useState(null); // Countdown en segundos
  const [countdownActive, setCountdownActive] = useState(false); // Flag para activar el countdown
  const [showQRModal, setShowQRModal] = useState(false); // Estado para modal de QR
  const nextRoundTimestamp = useRef(null); // Guardar el timestamp original

  useEffect(() => {
    const fetchInitialState = async () => {
      try {
        const response = await api.get(`/rooms/${roomId}/state`);
        setWord(response.data.word);
        setCurrentRound(response.data.round);
        setTotalPlayers(response.data.totalPlayers);
        setIsAdmin(response.data.isAdmin); // Ahora viene del backend
      } catch (err) {
        console.error("Error al cargar estado:", err);
        setError("No se pudo cargar la sala");
      }
    };

    fetchInitialState();

    const interval = setInterval(async () => {
      try {
        const res = await api.get(`/rooms/${roomId}/state`);
        
        // Guardar el timestamp solo la primera vez que llega
        if (res.data.nextRoundAt && !nextRoundTimestamp.current) {
          nextRoundTimestamp.current = res.data.nextRoundAt;
          setCountdownActive(true); // Activar el countdown
        }
        
        // Limpiar el timestamp si ya no hay countdown
        if (!res.data.nextRoundAt && nextRoundTimestamp.current) {
          nextRoundTimestamp.current = null;
          setCountdown(null);
          setCountdownActive(false);
        }
        
        if (res.data.round !== currentRound) {
          setCurrentRound(res.data.round);
          setWord(res.data.word);
          nextRoundTimestamp.current = null; // Limpiar al cambiar de ronda
          setCountdown(null);
          setCountdownActive(false);
        }
        setTotalPlayers(res.data.totalPlayers);
        setIsAdmin(res.data.isAdmin); // Actualizar estado de admin
      } catch (err) {
        console.error("Error en polling:", err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [roomId, currentRound]);

  // Efecto separado para actualizar el countdown cada segundo
  useEffect(() => {
    if (!countdownActive || !nextRoundTimestamp.current) return;

    const updateCountdown = () => {
      const timeLeft = Math.ceil((nextRoundTimestamp.current - Date.now()) / 1000);
      if (timeLeft <= 0) {
        // Countdown terminado
        setCountdown(null);
        setCountdownActive(false);
        nextRoundTimestamp.current = null;
      } else {
        setCountdown(timeLeft);
      }
    };

    // Actualizar inmediatamente
    updateCountdown();

    // Actualizar cada segundo
    const timer = setInterval(updateCountdown, 1000);

    return () => clearInterval(timer);
  }, [countdownActive]);

  const handleRestart = async () => {
    setLoading(true);
    try {
      await api.post(`/rooms/${roomId}/restart`); // Ya no necesita adminId
      if (navigator.vibrate) navigator.vibrate([50, 100, 50]);
    } catch (err) {
      console.error("Error al reiniciar:", err);
      alert("Solo el administrador puede reiniciar la partida");
    } finally {
      setLoading(false);
    }
  };

  const copyRoomLink = () => {
    const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
    const link = `${baseUrl}/#/?join=${roomId}`;
    navigator.clipboard.writeText(link);
    if (navigator.vibrate) navigator.vibrate(30);
    alert(`Link copiado: ${link}`);
  };

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20">
        <h1 className="text-2xl font-bold mb-4 text-red-400">❌ {error}</h1>
        <button onClick={() => navigate("/")} className="bg-white/20 px-6 py-3 rounded-lg hover:bg-white/30 transition-all">
          🔙 Volver al inicio
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20 text-center">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-blue-500/20 px-4 py-2 rounded-lg border border-blue-500/30">
          <p className="text-xs text-gray-400">Ronda {currentRound} • {totalPlayers} jugadores</p>
        </div>

        {/* Mostrar countdown si está activo */}
        {countdown !== null && countdown > 0 ? (
          <div className="bg-gradient-to-br from-orange-600/30 to-red-600/30 p-12 rounded-2xl border-2 border-orange-500/50 shadow-[0_0_40px_rgba(251,146,60,0.5)] animate-pulse">
            <p className="text-sm text-orange-300 mb-3">⏳ Nueva ronda en:</p>
            <h1 className="text-8xl font-black text-white mb-2">{countdown}</h1>
            <p className="text-xs text-gray-300 mt-2">Todos se actualizarán al mismo tiempo</p>
          </div>
        ) : (
          <div className="bg-gradient-to-br from-purple-600/20 to-pink-600/20 p-8 rounded-2xl border-2 border-purple-500/50 shadow-[0_0_30px_rgba(168,85,247,0.4)]">
            <p className="text-sm text-purple-300 mb-2">Tu palabra es:</p>
            <h1 className="text-5xl font-bold text-white mb-2">{word || "..."}</h1>
            {word === "???" && (
              <p className="text-amber-400 text-sm font-semibold animate-pulse">
                🕵️ ¡Eres el impostor!
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col gap-3">
          <button onClick={copyRoomLink} className="bg-blue-500/80 px-4 py-3 rounded-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all">
            📋 Compartir link de invitación
          </button>

          <button onClick={() => setShowQRModal(true)} className="bg-purple-500/80 px-4 py-3 rounded-lg font-semibold hover:bg-purple-600 active:scale-95 transition-all">
            📱 Mostrar QR
          </button>

          {isAdmin && (
            <button 
              onClick={handleRestart} 
              disabled={loading || countdown !== null} 
              className="bg-emerald-500 px-4 py-3 rounded-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Reiniciando..." : countdown !== null ? "⏳ Esperando..." : "🔄 Volver a jugar"}
            </button>
          )}
        </div>
      </div>

      {/* Modal de QR */}
      {showQRModal && (
        <div 
          className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 z-50"
          onClick={() => setShowQRModal(false)}
        >
          <div 
            className="bg-gray-900 rounded-2xl p-8 max-w-sm w-full border-2 border-purple-500/50 shadow-[0_0_40px_rgba(168,85,247,0.3)]"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-center mb-2">🕵️‍♂️ SpyWord</h2>
            <p className="text-sm text-gray-400 text-center mb-6">Escanea para unirte</p>
            
            <div className="bg-white p-6 rounded-xl mb-6">
              <QRCodeCanvas 
                value={`${import.meta.env.VITE_BASE_URL || window.location.origin}/#/?join=${roomId}`}
                size={240}
                bgColor="#ffffff"
                fgColor="#000000"
                level="H"
              />
            </div>

            <div className="bg-purple-500/20 px-6 py-3 rounded-lg border-2 border-purple-500/50 mb-6">
              <p className="text-xs text-purple-300 mb-1 text-center">Código de sala:</p>
              <p className="text-purple-400 font-mono text-3xl font-bold tracking-widest text-center">{roomId}</p>
            </div>

            <button 
              onClick={() => setShowQRModal(false)}
              className="w-full bg-white/20 px-4 py-3 rounded-lg font-semibold hover:bg-white/30 active:scale-95 transition-all"
            >
              ✕ Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

