import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";
import { getUserName } from "../utils/nameGenerator";
import AppHeader from "../components/AppHeader";
import AdPlaceholder from "../components/AdPlaceholder";
import InterstitialAd from "../components/InterstitialAd";

export default function Online() {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [isPremium] = useState(false); // Control global de anuncios (banners)
  const [isRoomPremium] = useState(false); // Premium Pass - false porque aún no hay sala

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
            <button
              onClick={handleCreateRoom}
              disabled={loading}
              className="bg-emerald-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Play size={20} />
              <span>{loading ? "Creando..." : "Crear partida"}</span>
            </button>
            <button
              onClick={() => setMode("join")}
              className="bg-blue-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all"
            >
              🔗 Unirse a partida
            </button>

            {/* Banner Publicitario */}
            <div className="flex justify-center mt-4">
              <AdPlaceholder isPremium={isPremium} format="rectangle" />
            </div>
          </div>
        )}

        {mode === "join" && (
          <div className="flex flex-col items-center gap-4 mt-4 max-w-md w-full">
            <p className="text-xl font-semibold">Únete a una partida</p>

            <div className="bg-blue-500/20 px-4 py-3 rounded-lg border border-blue-500/30 w-full">
              <p className="text-xs text-blue-300 mb-1">💡 Tip</p>
              <p className="text-sm text-gray-300">Puedes escanear el código QR con tu cámara nativa y te llevará directo al juego</p>
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
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
            isRoomPremium={isRoomPremium}
            onClose={handleInterstitialClose}
          />
        )}
      </div>
    </>
  );
}
