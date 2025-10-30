import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "../services/api";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);

  // Detectar si viene de un QR con parámetros de sala en la URL
  useEffect(() => {
    // Verificar si la URL actual es la home y hay un hash con room
    const hash = window.location.hash;
    const roomMatch = hash.match(/#\/room\/([A-Z0-9]+)\/([a-z0-9-]+)/i);
    
    if (roomMatch && location.pathname === '/') {
      const [, roomId, userId] = roomMatch;
      // Navegar directamente a la sala
      navigate(`/room/${roomId}/${userId}`, { replace: true });
    }
  }, [location, navigate]);

  const createRoom = async () => {
    setLoading(true);
    try {
      const response = await api.post('/rooms/create');
      const roomId = response.data.roomId;
      const adminId = response.data.adminId;
      setCreatedRoom({ roomId, adminId });
      setMode("created");
      if (navigator.vibrate) navigator.vibrate(50);
    } catch (error) {
      console.error("Error al crear sala:", error);
      alert("Error al crear la sala. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const joinRoom = async (code) => {
    const roomId = code.trim().toUpperCase();
    if (!roomId) return;
    setLoading(true);
    try {
      const response = await api.post('/rooms/' + roomId + '/join');
      const playerId = response.data.playerId;
      navigate('/room/' + roomId + '/' + playerId);
      if (navigator.vibrate) navigator.vibrate(40);
    } catch (error) {
      console.error("Error al unirse:", error);
      alert("No se pudo unir a la sala. Verifica el código.");
    } finally {
      setLoading(false);
    }
  };

  const enterAsAdmin = () => {
    if (createdRoom) {
      navigate('/room/' + createdRoom.roomId + '/' + createdRoom.adminId);
    }
  };

  const resetView = () => {
    setMode(null);
    setCreatedRoom(null);
    setRoomCode("");
  };

  // Usar variable de entorno o fallback a window.location.origin
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const qrValue = createdRoom ? `${baseUrl}/#/room/${createdRoom.roomId}/${createdRoom.adminId}` : '';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">🕵️‍♂️ Impostor Word</h1>
      {!mode && (
        <div className="flex flex-col gap-4">
          <button onClick={createRoom} disabled={loading} className="bg-emerald-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50">
            {loading ? "Creando..." : "🧩 Crear partida"}
          </button>
          <button onClick={() => setMode("join")} className="bg-blue-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all">
            🔗 Unirse a partida
          </button>
        </div>
      )}
      {mode === "created" && createdRoom && (
        <div className="flex flex-col items-center gap-4 mt-6">
          <p className="text-lg">¡Sala creada! Comparte este QR:</p>
          <p className="text-sm text-gray-400">Los jugadores pueden escanearlo con su cámara</p>
          
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <QRCodeCanvas value={qrValue} size={220} bgColor="#ffffff" fgColor="#000000" level="H" />
          </div>
          
          <div className="bg-amber-500/20 px-6 py-3 rounded-lg border-2 border-amber-500/50">
            <p className="text-xs text-amber-300 mb-1">Código de sala:</p>
            <p className="text-amber-400 font-mono text-4xl font-bold tracking-widest">{createdRoom.roomId}</p>
          </div>
          
          <button 
            onClick={() => {
              navigator.clipboard.writeText(createdRoom.roomId);
              if (navigator.vibrate) navigator.vibrate(30);
            }} 
            className="text-sm underline hover:text-amber-300 transition-colors"
          >
            📋 Copiar código
          </button>

          <button onClick={enterAsAdmin} className="mt-4 bg-emerald-500 px-8 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all">
            ▶️ Entrar a la sala
          </button>
          <button onClick={resetView} className="mt-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
            🔙 Volver
          </button>
        </div>
      )}
      {mode === "join" && (
        <div className="flex flex-col items-center gap-4 mt-4 max-w-md w-full">
          <p className="text-lg font-semibold">Únete a una partida</p>
          <p className="text-sm text-gray-400">Ingresa el código de 6 caracteres</p>
          
          <div className="flex flex-col gap-3 w-full mt-4">
            <input 
              className="bg-gray-800 px-6 py-4 rounded-xl text-center text-2xl font-mono uppercase tracking-widest border-2 border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors" 
              placeholder="A7DLK4" 
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
              maxLength={6}
              autoFocus
            />
            
            <button 
              onClick={() => joinRoom(roomCode)} 
              disabled={loading || !roomCode || roomCode.length !== 6} 
              className="bg-emerald-500 px-6 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? "Uniéndose..." : "🔗 Unirse a la sala"}
            </button>
          </div>

          <button onClick={resetView} className="mt-6 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
            🔙 Volver
          </button>
        </div>
      )}
    </div>
  );
}
