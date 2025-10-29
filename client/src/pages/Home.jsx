import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QRCodeCanvas } from "qrcode.react";
import { api } from "../services/api";

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mode, setMode] = useState(null);
  const [roomCode, setRoomCode] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [loading, setLoading] = useState(false);
  const [createdRoom, setCreatedRoom] = useState(null);

  // Cargar nombre de localStorage si existe
  useEffect(() => {
    const savedName = localStorage.getItem("playerName");
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Detectar si viene de un link compartido con parámetro ?join=CODIGO
  useEffect(() => {
    // Con hash routing, los parámetros están en location.hash, no en location.search
    const hash = location.hash; // Ej: "#/?join=8EBIRH"
    const queryStart = hash.indexOf('?');
    
    if (queryStart !== -1) {
      const queryString = hash.substring(queryStart + 1); // "join=8EBIRH"
      const searchParams = new URLSearchParams(queryString);
      const joinCode = searchParams.get('join');
      
      if (joinCode) {
        // Pre-llenar el código y mostrar el modo de unirse
        setRoomCode(joinCode.toUpperCase());
        setMode("join");
      }
    }
  }, [location.hash]);

  const createRoom = async () => {
    const adminName = playerName.trim();
    
    if (!adminName) {
      alert("Por favor ingresa tu nombre");
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/rooms/create', { adminName });
      const roomId = response.data.roomId;
      setCreatedRoom({ roomId });
      // Guardar nombre en localStorage
      localStorage.setItem("playerName", adminName);
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
    const playerName_ = playerName.trim();
    
    if (!roomId || !playerName_) {
      alert("Por favor completa código y nombre");
      return;
    }
    
    setLoading(true);
    try {
      await api.post(`/rooms/${roomId}/join`, { playerName: playerName_ });
      // Guardar nombre en localStorage
      localStorage.setItem("playerName", playerName_);
      navigate(`/room/${roomId}`);
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
      navigate('/room/' + createdRoom.roomId);
    }
  };

  const resetView = () => {
    setMode(null);
    setCreatedRoom(null);
    setRoomCode("");
  };

  // Usar variable de entorno o fallback a window.location.origin
  const baseUrl = import.meta.env.VITE_BASE_URL || window.location.origin;
  const qrValue = createdRoom ? `${baseUrl}/#/?join=${createdRoom.roomId}` : '';

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-6 text-center">
      <h1 className="text-3xl font-bold mb-6">🕵️‍♂️ SpyWord</h1>
      {!mode && (
        <div className="flex flex-col gap-4">
          <button onClick={() => setMode("create")} className="bg-emerald-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all">
            🧩 Crear partida
          </button>
          <button onClick={() => setMode("join")} className="bg-blue-500 px-6 py-3 rounded-xl text-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all">
            🔗 Unirse a partida
          </button>
        </div>
      )}
      {mode === "create" && (
        <div className="flex flex-col items-center gap-4 mt-4 max-w-md w-full">
          <p className="text-lg font-semibold">Crear nueva partida</p>
          <p className="text-sm text-gray-400">Ingresa tu nombre</p>
          
          <input 
            className="bg-gray-800 px-6 py-4 rounded-xl text-center text-lg font-semibold uppercase border-2 border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors w-full" 
            placeholder="Tu nombre" 
            value={playerName} 
            onChange={(e) => setPlayerName(e.target.value)} 
            maxLength={20}
            autoFocus
          />
          
          <button onClick={createRoom} disabled={loading || !playerName.trim()} className="w-full bg-emerald-500 px-6 py-4 rounded-xl text-lg font-semibold hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            {loading ? "Creando..." : "✓ Crear partida"}
          </button>
          
          <button onClick={resetView} className="mt-2 bg-white/20 px-4 py-2 rounded-lg hover:bg-white/30 transition-all">
            � Volver
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
              const link = `${baseUrl}/#/?join=${createdRoom.roomId}`;
              navigator.clipboard.writeText(link);
              if (navigator.vibrate) navigator.vibrate(30);
              alert(`Link copiado: ${link}`);
            }} 
            className="text-sm underline hover:text-amber-300 transition-colors"
          >
            📋 Copiar link de invitación
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
          <p className="text-sm text-gray-400">Ingresa el código y tu nombre</p>
          
          <div className="flex flex-col gap-3 w-full mt-4">
            <input 
              className="bg-gray-800 px-6 py-4 rounded-xl text-center text-lg font-semibold uppercase border-2 border-gray-700 focus:border-blue-500 focus:outline-none transition-colors" 
              placeholder="Tu nombre" 
              value={playerName} 
              onChange={(e) => setPlayerName(e.target.value)} 
              maxLength={20}
            />

            <input 
              className="bg-gray-800 px-6 py-4 rounded-xl text-center text-2xl font-mono uppercase tracking-widest border-2 border-gray-700 focus:border-emerald-500 focus:outline-none transition-colors" 
              placeholder="A7DLK4" 
              value={roomCode} 
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())} 
              maxLength={6}
            />
            
            <button 
              onClick={() => joinRoom(roomCode)} 
              disabled={loading || !roomCode || roomCode.length !== 6 || !playerName.trim()} 
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
