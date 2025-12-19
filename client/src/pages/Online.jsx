import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Play, ArrowLeft, Link2, Camera, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { getUserName } from "../utils/nameGenerator";
import AppHeader from "../components/AppHeader";
import AdPlaceholder from "../components/AdPlaceholder";
import InterstitialAd from "../components/InterstitialAd";
import QRScanner from "../components/QRScanner";
import { useAuth } from "../contexts/AuthContext";

export default function Online() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const { isPremium } = useAuth();
  const isRoomPremium = false; // Premium Pass - false porque aún no hay sala

  // Cambiar título de la página
  useEffect(() => {
    document.title = "ImpostorWord - Juego Online";
    return () => {
      document.title = "ImpostorWord";
    };
  }, []);

  const handleCreateRoom = () => {
    // Mostrar viñeta intersticial antes de crear la sala
    setShowInterstitial(true);
  };

  const createRoom = async () => {
    setLoading(true);
    try {
      const playerName = getUserName();
      const response = await api.post('/rooms/create', { adminName: playerName });
      const roomId = response.data.roomId;
      toast.success(`¡Partida creada! Código: ${roomId}`);
      if (navigator.vibrate) navigator.vibrate(50);
      navigate(`/room/${roomId}`);
    } catch (error) {
      console.error("Error al crear sala:", error);
      toast.error("Error al crear la sala. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const handleInterstitialClose = () => {
    setShowInterstitial(false);
    createRoom();
  };

  const joinRoom = async (code) => {
    const roomId = code.trim().toUpperCase();

    if (!roomId) {
      toast.error("Por favor ingresa el código");
      return;
    }

    setLoading(true);
    try {
      const playerName = getUserName();
      await api.post(`/rooms/${roomId}/join`, { playerName });
      toast.success("¡Te uniste a la sala!");
      navigate(`/room/${roomId}`);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      console.error("Error al unirse:", error);
      toast.error("No se pudo unir a la sala. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  const resetView = () => {
    setMode(null);
    setRoomCode("");
  };

  const handleScanQR = () => {
    setShowQRScanner(true);
  };

  const handleQRScanResult = async (roomCode) => {
    setShowQRScanner(false);
    toast.success(`Código detectado: ${roomCode}`);

    // Unirse automáticamente
    setLoading(true);
    try {
      const playerName = getUserName();
      await api.post(`/rooms/${roomCode}/join`, { playerName });
      toast.success("¡Te uniste a la sala!");
      navigate(`/room/${roomCode}`);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      console.error("Error al unirse:", error);
      toast.error("No se pudo unir a la sala. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AppHeader />
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 pt-20 text-center">
        {/* Botón de volver */}
        <button
          onClick={() => navigate('/')}
          className="absolute top-20 left-6 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-lg transition-all flex items-center gap-2"
        >
          <ArrowLeft size={20} />
          <span>Volver</span>
        </button>

        <h1 className="text-3xl font-bold mb-6">Juego Online 🌐</h1>

        {!mode && (
          <div className="flex flex-col gap-4 max-w-md w-full">
            {/* Botón Crear Partida */}
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-6 py-5 rounded-xl hover:from-emerald-600 hover:to-emerald-700 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-4 shadow-lg"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <Play size={28} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-xl font-bold">{loading ? "Creando..." : "Crear partida"}</span>
                <span className="text-sm text-emerald-100 opacity-90">Inicia un nuevo juego como anfitrión</span>
              </div>
            </button>

            {/* Botón Unirse a Partida */}
            <button
              onClick={() => setMode("join")}
              className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 rounded-xl hover:from-blue-600 hover:to-blue-700 active:scale-95 transition-all flex items-center gap-4 shadow-lg"
            >
              <div className="bg-white/20 p-3 rounded-lg">
                <Link2 size={28} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-xl font-bold">Unirse a partida</span>
                <span className="text-sm text-blue-100 opacity-90">Entra con código o escanea QR</span>
              </div>
            </button>

            {/* Banner Publicitario */}
            <div className="flex justify-center mt-4">
              <AdPlaceholder isPremium={isPremium} format="rectangle" />
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col items-center gap-4 mt-4 max-w-md w-full">
            {/* Título con botón de ayuda */}
            <div className="flex items-center gap-2">
              <p className="text-xl font-semibold">Únete a una partida</p>
              <button
                onClick={() => setShowHelp(!showHelp)}
                className="bg-blue-500/20 hover:bg-blue-500/30 p-2 rounded-lg transition-all"
              >
                <HelpCircle size={20} className="text-blue-400" />
              </button>
            </div>

            {/* Mensaje de ayuda */}
            {showHelp && (
              <div className="bg-blue-500/20 px-4 py-3 rounded-lg border border-blue-500/30 w-full relative">
                <button
                  onClick={() => setShowHelp(false)}
                  className="absolute top-2 right-2 text-blue-300 hover:text-blue-100 transition-colors"
                >
                  ✕
                </button>
                <p className="text-sm text-blue-200 text-center pr-6">
                  <strong className="block mb-2">¿Cómo unirse?</strong>
                  📱 <strong>Escanear QR:</strong> Usa tu cámara para escanear el código QR de la sala
                  <br />
                  ⌨️ <strong>Código de sala:</strong> Ingresa manualmente el código de 6 caracteres
                </p>
              </div>
            )}

            {/* Botón Escanear QR con Cámara */}
            <button
              onClick={handleScanQR}
              className="w-full bg-gradient-to-r from-purple-500 to-purple-600 px-6 py-4 rounded-xl hover:from-purple-600 hover:to-purple-700 active:scale-95 transition-all flex items-center gap-4 shadow-lg"
            >
              <div className="bg-white/20 p-2.5 rounded-lg">
                <Camera size={24} />
              </div>
              <div className="flex flex-col items-start text-left">
                <span className="text-lg font-bold">Escanear QR</span>
                <span className="text-xs text-purple-100 opacity-90">Usa tu cámara para unirte rápido</span>
              </div>
            </button>

            {/* Separador */}
            <div className="flex items-center gap-3 w-full my-2">
              <div className="flex-1 h-px bg-gray-700"></div>
              <span className="text-sm text-gray-500 font-medium">O</span>
              <div className="flex-1 h-px bg-gray-700"></div>
            </div>

            <div className="flex flex-col gap-3 w-full">
              <input
                className="bg-gray-800 px-6 py-4 rounded-xl text-center text-lg font-semibold uppercase border-2 border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors placeholder:text-gray-500"
                placeholder="CÓDIGO (6 letras)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                maxLength={6}
                autoFocus
              />

              <button
                onClick={() => joinRoom(roomCode)}
                disabled={loading || !roomCode || roomCode.length !== 6}
                className="bg-emerald-500 px-6 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Play size={20} />
                <span>{loading ? "Uniéndose..." : "Unirse"}</span>
              </button>
            </div>

            <button onClick={resetView} className="bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all mt-2">
              ← Volver
            </button>
          </div>
        )}

        {/* Viñeta Intersticial */}
        {showInterstitial && (
          <InterstitialAd
            isPremium={isPremium}
            isRoomPremium={isRoomPremium}
            onClose={handleInterstitialClose}
          />
        )}

        {/* Scanner QR */}
        {showQRScanner && (
          <QRScanner
            onScan={handleQRScanResult}
            onClose={() => setShowQRScanner(false)}
          />
        )}
      </div>
    </>
  );
}
